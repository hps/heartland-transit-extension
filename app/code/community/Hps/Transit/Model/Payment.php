<?php

use Mage;
use GlobalPayments\Api\Entities\Address;
use GlobalPayments\Api\Entities\StoredCredential;
use GlobalPayments\Api\Entities\Transaction;
use GlobalPayments\Api\Entities\Enums\CardType;
use GlobalPayments\Api\Entities\Enums\StoredCredentialInitiator;
use GlobalPayments\Api\Entities\Exceptions\ApiException;
use GlobalPayments\Api\PaymentMethods\CreditCardData;

/**
 * @category   Hps
 * @package    Hps_Transit
 * @copyright  Copyright (c) 2015 Heartland Payment Systems (https://www.magento.com)
 * @license    https://github.com/SecureSubmit/heartland-magento-extension/blob/master/LICENSE  Custom License
 */
class Hps_Transit_Model_Payment extends Mage_Payment_Model_Method_Cc
{
    const FRAUD_TEXT_DEFAULT              = '%s';
    const FRAUD_VELOCITY_ATTEMPTS_DEFAULT = 3;
    const FRAUD_VELOCITY_TIMEOUT_DEFAULT  = 10;
    const CHECKOUT_SESSION_MODEL_PATH     = 'checkout/session';

    protected $_code                        = 'hps_transit';
    protected $_isGateway                   = true;
    protected $_canCapture                  = true;
    protected $_canCapturePartial           = true;
    protected $_canRefund                   = true;
    protected $_canRefundInvoicePartial     = true;
    protected $_canVoid                     = true;
    protected $_canAuthorize                = true;
    protected $_supportedCurrencyCodes      = array('USD');
    protected $_minOrderTotal               = 0.5;
    protected $_formBlockType               = 'hps_transit/form';
    protected $_formBlockTypeAdmin          = 'hps_transit/adminhtml_form';
    protected $_infoBlockType               = 'hps_transit/info';
    protected $_enable_anti_fraud           = null;
    protected $_allow_fraud                 = null;
    protected $_email_fraud                 = null;
    protected $_fraud_address               = null;
    protected $_fraud_text                  = null;
    protected $_use_iframes                 = null;
    protected $_fraud_velocity_attempts     = null;
    protected $_fraud_velocity_timeout      = null;

    public function validate()
    {
        $info = $this->getInfoInstance();
        $additionalData = new Varien_Object($info->getAdditionalData() ? unserialize($info->getAdditionalData()) : null);
        $secureToken = $additionalData->getTransitToken() ? $additionalData->getTransitToken() : null;
        // Gracefully handle javascript errors.
        $currentUrl = Mage::helper('core/url')->getCurrentUrl();
        $link_path = explode('/', rtrim($currentUrl, '/'));
        $path = end($link_path);

        if ((!$secureToken) && ($path != 'savePaymentMethod')) {
            Mage::log('Payment information submitted without token.', Zend_Log::ERR);
            $this->throwUserError(Mage::helper('hps_transit')->__('An unexpected error occurred. Please try resubmitting your payment information.'), null, true);
        }
        return $this;
    }

    /**
     * Capture payment
     *
     * @param Varien_Object $payment
     * @param float $amount
     * @return  $this
     */
    public function capture(Varien_Object $payment, $amount)
    {
        $this->_authorize($payment, $amount, true);
    }

    /**
     * Authorize payment
     *
     * @param Varien_Object $payment
     * @param float $amount
     * @return  $this
     */
    public function authorize(Varien_Object $payment, $amount)
    {
        $this->_authorize($payment, $amount, false);
    }

    /**
     * Authorize or Capture payment
     *
     * @param Varien_Object|Mage_Sales_Model_Order_Payment $payment
     * @param float $amount
     * @param bool $capture
     * @return  $this
     */
    private function _authorize(Varien_Object $payment, $amount, $capture)
    {
        $this->getFraudSettings();

        /* @var $order Mage_Sales_Model_Order */
        $order = $payment->getOrder();
        $multiToken = false;
        $cardData = null;
        $additionalData = new Varien_Object($payment->getAdditionalData() ? unserialize($payment->getAdditionalData()) : null);
        $secureToken = $additionalData->getTransitToken() ? $additionalData->getTransitToken() : null;
        $saveCreditCard = (bool) $additionalData->getCcSaveFuture();
        $useStoredCard = (bool) $additionalData->getCcUseMulti();
        $customerId = $additionalData->getCustomerId();

        $cardType = $payment->getCcType();
        if ($saveCreditCard) {
            $multiToken = true;
            $cardData = new CreditCardData();
            $cardData->number = $payment->getCcLast4();
            $cardData->expYear = $payment->getCcExpYear();
            $cardData->expMonth = $payment->getCcExpMonth();
            $cardData->cardType = $this->_getCardType($cardType);
        }

        Mage::helper('hps_transit/data')->configureSDK();
        $address = $this->_getCardHolderAddress($order);
        $memo = $this->_getTxnMemo($order);
        $invoiceNumber = $this->_getTxnInvoiceNumber($order);
        $customerId = $this->_getTxnCustomerId($order);

        $cardOrToken = new CreditCardData();
        $cardOrToken->token = $secureToken;
        $cardOrToken->expYear = $payment->getCcExpYear();
        $cardOrToken->expMonth = $payment->getCcExpMonth();
        $cardOrToken->cvn = $payment->getCcCid();
        $cardOrToken->cardHolderName = $this->_getCardHolderName($order);
        $cardOrToken->cardType = $this->_getCardType($cardType);

        try {
            $this->checkVelocity();

            $builder = null;
            if ($capture && $payment->getCcTransId()) {
                $builder = Transaction::fromId($payment->getCcTransId())->capture();
            } else {
                $requestType = $capture ? 'charge' : 'authorize';
                $builder = $cardOrToken->{$requestType}($amount)
                    ->withCurrency(strtolower($order->getBaseCurrencyCode()))
                    ->withClientTransactionId(time())
                    ->withAddress($address)
                    ->withRequestMultiUseToken($multiToken)
                    ->withDescription($memo)
                    ->withInvoiceNumber($invoiceNumber)
                    ->withCustomerId($customerId);

                $customer = Mage::getSingleton('customer/session')->getCustomer();
                if ($customer) {
                    $builder = $builder->withLastRegisteredDate(Mage::getModel('core/date')->date('m/d/Y', $customer->getCreatedAt()));
                }
            }

            if ($useStoredCard === true) {
                $storedCreds = new StoredCredential;
                $storedCreds->initiator = StoredCredentialInitiator::MERCHANT;

                $builder = $builder->withStoredCredential($storedCreds);
            }

            $response = $builder->execute();

            if ($response->responseCode !== '00' || $response->responseMessage === 'Partially Approved') {
                // TODO: move this
                // $this->updateVelocity($e);

                if ($response->responseCode === '10' || $response->responseMessage === 'Partially Approved') {
                    try { $response->void()->withDescription('POST_AUTH_USER_DECLINE')->execute(); } catch (\Exception $e) {}
                }

                if (!$this->_allow_fraud || $response->responseCode !== 'FR') {
                    throw new ApiException($this->mapResponseCodeToFriendlyMessage($response->responseCode));
                }

                // we can skip the card saving if it fails for possible fraud there will be no token.
                if ($this->_email_fraud && $this->_fraud_address != '') {
                    // EMAIL THE PEOPLE
                    $this->sendEmail(
                        $this->_fraud_address,
                        $this->_fraud_address,
                        'Suspicious order (' . $order->getIncrementId() . ') allowed',
                        'Hello,<br><br>Heartland has determined that you should review order ' . $order->getRealOrderId() . ' for the amount of ' . $amount . '.'
                    );
                }

                $this->closeTransaction($payment,$amount,$e);

                return;
            }

            $this->_debugChargeService();
            // \Hps_Transit_Model_Payment::closeTransaction
            $this->closeTransaction($payment, $amount, $response);

            if ($multiToken) {
                $this->saveMultiUseToken($response, $cardData, $customerId, $cardType);
            }
        } catch (ApiException $e) {
            $this->_debugChargeService($e);
            $payment->setStatus(self::STATUS_ERROR);
            $this->throwUserError($e->getMessage(), null, true);
        } catch (Exception $e) {
            $this->_debugChargeService($e);
            Mage::logException($e);
            $payment->setStatus(self::STATUS_ERROR);
            $this->throwUserError($e->getMessage());
        }

        return $this;
    }


    /**
     * @param Varien_Object|Mage_Sales_Model_Order_Payment $payment
     * @param float $amount
     * @return Hps_Transit_Model_Payment
     */
    public function refund(Varien_Object $payment, $amount)
    {
        Mage::helper('hps_transit/data')->configureSDK();

        $transactionId = $payment->getCcTransId();
        /* @var $order Mage_Sales_Model_Order */
        $order = $payment->getOrder();
        // $address = $this->_getCardHolderAddress($order);
        $memo = $this->_getTxnMemo($order);
        $invoiceNumber = $this->_getTxnInvoiceNumber($order);
        $customerId = $this->_getTxnCustomerId($order);

        try {
            $refundResponse = Transaction::fromId($transactionId)->refund($amount)
                ->withCurrency(strtolower($order->getBaseCurrencyCode()))
                ->withDescription($memo)
                ->withInvoiceNumber($invoiceNumber)
                ->withCustomerId($customerId)
                ->execute();
            $payment
                ->setTransactionId($refundResponse->transactionId)
                ->setParentTransactionId($transactionId)
                ->setIsTransactionClosed(1)
                ->setShouldCloseParentTransaction(1);
        } catch (ApiException $e) {
            $this->_debugChargeService($e);
            $this->throwUserError($e->getMessage());
        } catch (Exception $e) {
            $this->_debugChargeService($e);
            Mage::logException($e);
            $this->throwUserError($e->getMessage());
        }

        return $this;
    }


    /**
     * Void payment abstract method
     *
     * @param Varien_Object $payment
     *
     * @return Hps_Transit_Model_Payment
     */
    public function void(Varien_Object $payment)
    {
        Mage::helper('hps_transit/data')->configureSDK();

        $transactionId = null;

        if (false !== ($parentId = $this->getParentTransactionId($payment))) {
            $transactionId = $parentId;
        } else {
            $transactionId = $payment->getCcTransId();
        }

        try {
            $voidResponse = Transaction::fromId($transactionId)->void()->withDescription('POST_AUTH_USER_DECLINE')->execute();
            $payment
                ->setTransactionId($voidResponse->transactionId)
                ->setParentTransactionId($transactionId)
                ->setIsTransactionClosed(1)
                ->setShouldCloseParentTransaction(1);
        } catch (ApiException $e) {
            $this->_debugChargeService($e);
            $this->throwUserError($e->getMessage());
        } catch (Exception $e) {
            $this->_debugChargeService($e);
            Mage::logException($e);
            $this->throwUserError(Mage::helper('hps_transit')->__('An unexpected error occurred. Please try again or contact a system administrator.'));
        }

        return $this;
    }

    /**
     * @param Varien_Object|Mage_Sales_Model_Order_Payment  $payment
     * @param float                                         $amount
     * @param HpsReportTransactionDetails|HpsAuthorization  $response
     * @param Mage_Payment_Model_Method_Abstract::STATUS_UNKNOWN|STATUS_APPROVED|STATUS_ERROR|STATUS_DECLINED|STATUS_VOID|STATUS_SUCCESS                                   $status
     */
    protected function closeTransaction($payment, $amount, $response, $status = self::STATUS_APPROVED){
        $info = $this->getInfoInstance();
        $details = unserialize($info->getAdditionalData());

        $payment->setStatus($status);
        $payment->setAmount($amount);
        $payment->setLastTransId($response->transactionId);
        $payment->setCcTransId(($response instanceof HpsReportTransactionDetails) ? $payment->getCcTransId() : $response->transactionId);
        $payment->setTransactionId($response->transactionId);
        $payment->setIsTransactionClosed(0);

        $details['cc_type'] = $payment->getCcType();

        if (property_exists($response, 'authorizationCode')) {
            $payment->setCcApproval($response->authorizationCode);
            $details['auth_code'] = $response->authorizationCode;
        }

        if (property_exists($response, 'avsResultCode')) {
            $payment->setCcAvsStatus($response->avsResultCode);
            $details['avs_response_code'] = $response->avsResultCode;
            $details['avs_response_text'] = $response->avsResultText;
        }

        if (property_exists($response, 'cvvResultCode')) {
            $details['cvv_response_code'] = $response->cvvResultCode;
            $details['cvv_response_text'] = $response->cvvResultText;
        }

        $info->setAdditionalData(serialize($details));
    }

    protected function saveMultiUseToken($response, $cardData, $customerId, $cardType)
    {
        $token = $response->token;

        if (empty($token)) {
            Mage::log('Requested multi token has not been generated for the transaction # ' . $response->transactionId, Zend_Log::WARN);
            return;
        }

        if ($customerId > 0) {
            Mage::helper('hps_transit')->saveMultiToken($token, $cardData, $cardType, $customerId);
        } else {
            Mage::helper('hps_transit')->saveMultiToken($token, $cardData, $cardType);
        }
    }

    protected function _formatAmount($amount)
    {
        return Mage::helper('core')->currency($amount, true, false);
    }

    protected function getFraudSettings()
    {
        if ($this->_enable_anti_fraud === null) {
            $this->_enable_anti_fraud       = Mage::getStoreConfig('payment/hps_transit/enable_anti_fraud') == 1;
            $this->_allow_fraud             = Mage::getStoreConfig('payment/hps_transit/allow_fraud') == 1;
            $this->_email_fraud             = Mage::getStoreConfig('payment/hps_transit/email_fraud') == 1;
            $this->_fraud_address           = (string)Mage::getStoreConfig('payment/hps_transit/fraud_address');
            $this->_fraud_text              = (string)Mage::getStoreConfig('payment/hps_transit/fraud_text');
            $this->_fraud_velocity_attempts = (int)Mage::getStoreConfig('payment/hps_transit/fraud_velocity_attempts');
            $this->_fraud_velocity_timeout  = (int)Mage::getStoreConfig('payment/hps_transit/fraud_velocity_timeout');

            if ($this->_fraud_text === null) {
                $this->_fraud_text = self::FRAUD_TEXT_DEFAULT;
            }

            if ($this->_fraud_velocity_attempts === null
                || !is_numeric($this->_fraud_velocity_attempts)
            ) {
                $this->_fraud_velocity_attempts = self::FRAUD_VELOCITY_ATTEMPTS_DEFAULT;
            }

            if ($this->_fraud_velocity_timeout === null
                || !is_numeric($this->_fraud_velocity_timeout)
            ) {
                $this->_fraud_velocity_timeout = self::FRAUD_VELOCITY_TIMEOUT_DEFAULT;
            }
        }
    }

    protected function maybeResetVelocityTimeout()
    {
        $timeoutExpiration = (int)$this->getVelocityVar('TimeoutExpiration');

        if (time() < $timeoutExpiration) {
            return;
        }

        $this->unsVelocityVar('Count');
        $this->unsVelocityVar('IssuerResponse');
        $this->unsVelocityVar('TimeoutExpiration');
    }

    protected function checkVelocity()
    {
        if ($this->_enable_anti_fraud !== true) {
            return;
        }

        $this->maybeResetVelocityTimeout();

        $count = (int)$this->getVelocityVar('Count');
        $issuerResponse = (string)$this->getVelocityVar('IssuerResponse');
        $timeoutExpiration = (int)$this->getVelocityVar('TimeoutExpiration');

        if ($count >= $this->_fraud_velocity_attempts
            && time() < $timeoutExpiration) {
            sleep(5);
            throw new ApiException(sprintf($this->_fraud_text, $issuerResponse));
        }
    }

    protected function updateVelocity($e)
    {
        if ($this->_enable_anti_fraud !== true) {
            return;
        }

        $this->maybeResetVelocityTimeout();

        $count = (int)$this->getVelocityVar('Count');
        $issuerResponse = (string)$this->getVelocityVar('IssuerResponse');
        if ($issuerResponse !== $e->getMessage()) {
            $issuerResponse = $e->getMessage();
        }
        //                   NOW    + (fraud velocity timeout in seconds)
        $timeoutExpiration = time() + ($this->_fraud_velocity_timeout * 60);

        $this->setVelocityVar('Count', $count + 1);
        $this->setVelocityVar('IssuerResponse', $issuerResponse);
        $this->setVelocityVar('TimeoutExpiration', $timeoutExpiration);
    }

    protected function getVelocityVar($var)
    {
        return Mage::getSingleton(self::CHECKOUT_SESSION_MODEL_PATH)
            ->getData($this->getVelocityVarPrefix() . $var);
    }

    protected function setVelocityVar($var, $data = null)
    {
        return Mage::getSingleton(self::CHECKOUT_SESSION_MODEL_PATH)
            ->setData($this->getVelocityVarPrefix() . $var, $data);
    }

    protected function unsVelocityVar($var)
    {
        return Mage::getSingleton(self::CHECKOUT_SESSION_MODEL_PATH)
            ->unsetData($this->getVelocityVarPrefix() . $var);
    }

    protected function getVelocityVarPrefix()
    {
        return sprintf('HeartlandHPS_Velocity%s', md5($this->getRemoteIP()));
    }

    protected function getRemoteIP()
    {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            $remoteIP = $_SERVER['HTTP_CF_CONNECTING_IP'];
        } else if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $remoteIPArray = array_values(
                array_filter(
                    explode(
                        ',',
                        $_SERVER['HTTP_X_FORWARDED_FOR']
                    )
                )
            );
            $remoteIP = end($remoteIPArray);
        } else {
            $remoteIP = $_SERVER['REMOTE_ADDR'];
        }
        return $remoteIP;
    }

    public function getCurrentAuthorizationAmount($transactionDetails)
    {
        if (floatval($transactionDetails->settlementAmount) > 0) {
            return floatval($transactionDetails->settlementAmount);
        }
        return floatval($transactionDetails->authorizedAmount);
    }

    public function getTransactionDetails(Varien_Object $payment)
    {
        $transactionId = null;

        if (false !== ($parentId = $this->getParentTransactionId($payment))) {
            $transactionId = $parentId;
        } else {
            $transactionId = $payment->getCcTransId();
        }

        $service = $this->_getChargeService();
        return $service->get($transactionId)->execute();
    }


    public function transactionActiveOnGateway($transactionDetail)
    {
        // TODO: CHECK THIS
        return $transactionDetail->transactionStatus == 'A';
    }

    public function getParentTransactionId(Varien_Object $payment)
    {
        $transaction = Mage::getModel('sales/order_payment_transaction')->getCollection()
            ->addAttributeToFilter('order_id', array('eq' => $payment->getOrder()->getEntityId()))
            ->addAttributeToFilter('txn_type', array('eq' => 'capture'))
            ->toArray();
        if ($transaction['totalRecords'] == 1) {
            return isset($transaction['items'][0]['parent_txn_id'])
                ? $transaction['items'][0]['parent_txn_id'] : false;
        } else {
            return false;
        }
    }

    /**
     * @param null|Mage_Sales_Model_Quote $quote
     * @return bool
     */
    public function isAvailable($quote = null)
    {
        if ($quote && $quote->getBaseGrandTotal() < $this->_minOrderTotal) {
            return false;
        }

        return $this->getConfigData('transaction_key', ($quote ? $quote->getStoreId() : null))
            && parent::isAvailable($quote);
    }

    public function canUseForCurrency($currencyCode)
    {
        if (!in_array($currencyCode, $this->_supportedCurrencyCodes)) {
            return false;
        }
        return true;
    }

    public function assignData($data)
    {
        parent::assignData($data);

        if (!($data instanceof Varien_Object)) {
            $data = new Varien_Object($data);
        }

        $info = $this->getInfoInstance();

        if (!$info->getCcLast4() && $data->getCcLastFour()) {
            $info->setCcLast4($data->getCcLastFour());
        }

        $details = array();

        if ($data->getData('cc_save_future')) {
            $details['cc_save_future'] = 1;
        }

        if ($data->getData('cc_use_multi')) {
            $details['cc_use_multi'] = 1;
        }

        if ($data->getData('transit_token')) {
            $details['transit_token'] = $data->getData('transit_token');
        }

        if ($data->getData('use_credit_card')) {
            $details['use_credit_card'] = 1;
        }

        if ($data->getData('customer_id')) {
            $details['customer_id'] = $data->getData('customer_id');
        }

        if (!empty($details)) {
            $this->getInfoInstance()->setAdditionalData(serialize($details));
        }

        return $this;
    }

    /**
     * @param string $error
     * @param string $detailedError
     * @param bool $goToPaymentSection
     * @throws Mage_Core_Exception
     */
    public function throwUserError($error, $detailedError = null, $goToPaymentSection = false)
    {
        // Register detailed error for error reporting elsewhere
        $detailedError = $detailedError != null ?  $error.' ['.$detailedError.']' : $error;
        Mage::unregister('payment_detailed_error');
        Mage::register('payment_detailed_error', $detailedError);

        // Replace gateway error with custom error message for customers
        $error = Mage::helper('hps_transit')->__($error);
        if ($customMessage = $this->getConfigData('custom_message')) {
            $error = sprintf($customMessage, $error);
        }

        // Send checkout session back to payment section to avoid double-attempt to charge single-use token
        if ($goToPaymentSection === true) {
            Mage::log('throwing user error with Mage_Payment_Model_Info_Exception: ' . $error);
            throw new Mage_Payment_Model_Info_Exception($error);
        } else {
            Mage::log('throwing user error with Mage_Core_Exception: ' . $error);
            throw new Mage_Core_Exception($error);
        }
    }

    /**
     * @param Mage_Sales_Model_Order $order
     * @return Address
     */
    protected function _getCardHolderAddress($order)
    {
        $billing = $order->getBillingAddress();

        $address = new Address();
        $address->streetAddress1 = substr($billing->getStreet(1), 0, 40);        // Actual limit unknown..
        $address->city = substr($billing->getCity(), 0, 20);
        $address->province = substr($billing->getRegion(), 0, 20);
        $address->postalCode = substr(preg_replace('/[^A-Z0-9]/', '', strtoupper($billing->getPostcode())), 0, 9);
        $address->country = $billing->getCountry();

        return $address;
    }

    /**
     * @param Mage_Sales_Model_Order $order
     * @return string
     */
    protected function _getCardHolderName($order)
    {
        $billing = $order->getBillingAddress();

        $firstName = substr($billing->getData('firstname'), 0, 26);
        $lastName = substr($billing->getData('lastname'), 0, 26);

        return sprintf('%s %s', $firstName, $lastName);
    }


    /**
     * @param Mage_Sales_Model_Order $order
     * @return string
     */
    protected function _getTxnMemo($order)
    {
        $memo = array();
        $ip = $this->getRemoteIP();

        if ($ip) {
            $memo[] = 'Customer IP Address: ' . $ip;
        }

        if (isset($_SERVER['HTTP_USER_AGENT'])) {
            $memo[] = 'User Agent: '.$_SERVER['HTTP_USER_AGENT'];
        }

        $memo = implode(', ', $memo);
        return substr($memo, 0, 200);
    }

    /**
     * @param Mage_Sales_Model_Order $order
     * @return string
     */
    protected function _getTxnInvoiceNumber($order)
    {
        return $order->getIncrementId();
    }

    /**
     * @param Mage_Sales_Model_Order $order
     * @return string
     */
    protected function _getTxnCustomerId($order)
    {
        return substr($order->getCustomerEmail(), 0, 25);
    }

    /**
     * @param Exception|null $exception
     */
    protected function _debugChargeService($exception = null)
    {
        if ($this->getDebugFlag()) {
            $debugData = array(
                'store' => Mage::app()->getStore($this->getStore())->getFrontendName(),
                'exception_message' => $exception ? get_class($exception).': '.$exception->getMessage() : '',
            );
            $this->_debug($debugData);
        }
    }

    public function sendEmail($to, $from, $subject, $body, $headers = array(), $isHtml = true)
    {
        $headers[] = sprintf('From: %s', $from);
        $headers[] = sprintf('Reply-To: %s', $from);
        $message = $body;

        if ($isHtml) {
            $message = sprintf('<html><body>%s</body></html>', $body);
            $headers[] = 'MIME-Version: 1.0';
            $headers[] = 'Content-Type: text/html; charset=ISO-8859-1';
        }

        $message = wordwrap($message, 70, "\r\n");
        mail($to, $subject, $message, implode("\r\n", $headers));
    }

    /**
     * Retrieve block type for method form generation
     *
     * @return string
     */
    public function getFormBlockType()
    {
        return Mage::app()->getStore()->isAdmin() ? $this->_formBlockTypeAdmin : $this->_formBlockType;
    }

    protected function mapResponseCodeToFriendlyMessage($responseCode) {
        $result = '';

        switch ($responseCode) {
            case '02':
            case '03':
            case '04':
            case '05':
            case '41':
            case '43':
            case '44':
            case '51':
            case '56':
            case '61':
            case '62':
            case '63':
            case '65':
            case '78':
                $result = "The card was declined.";
                break;
            case '06':
            case '07':
            case '12':
            case '15':
            case '19':
            case '52':
            case '53':
            case '57':
            case '58':
            case '76':
            case '77':
            case '96':
            case 'EC':
                $result = "An error occurred while processing the card.";
                break;
            case '13':
                $result = "Must be greater than or equal 0.";
                break;
            case '54':
                $result = "The card has expired.";
                break;
            case '55':
                $result = "The pin is invalid.";
                break;
            case '75':
                $result = "Maximum number of pin retries exceeded.";
                break;
            case '80':
                $result = "Card expiration date is invalid.";
                break;
            case '86':
                $result = "Can't verify card pin number.";
                break;
            case 'EB':
            case 'N7':
                $result = "The card's security code is incorrect.";
                break;
            case '91':
                $result = "The card issuer timed-out.";
                break;
            case 'FR':
                $result = "Possible fraud detected";
                break;
            default:
                $result = "An unknown issuer error has occurred.";
                break;
        }

        return $result;
    }

    protected function isAdmin() {
        if (Mage::app()->getStore()->isAdmin()) {
            return true;
        }

        if (Mage::getDesign()->getArea() == 'adminhtml') {
            return true;
        }

        return false;
    }

    private function _getCardType($cardType)
    {
        $result = null;

        switch ($cardType) {
            case 'visa':
                $result = CardType::VISA;
                break;
            case 'mastercard':
                $result = CardType::MASTERCARD;
                break;
            case 'amex':
                $result = CardType::AMEX;
                break;
            case 'diners':
            case 'discover':
            case 'jcb':
                $result = CardType::DISCOVER;
                break;
            default:
                break;
        }

        return $result;
    }
}
