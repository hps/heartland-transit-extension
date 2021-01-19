<?php

use GlobalPayments\Api\ServicesContainer;
use GlobalPayments\Api\ServiceConfigs\AcceptorConfig;
use GlobalPayments\Api\ServiceConfigs\Gateways\TransitConfig;
use GlobalPayments\Api\Entities\Enums\CardDataSource;
use GlobalPayments\Api\Entities\Enums\Environment;
use GlobalPayments\Api\Entities\Enums\GatewayProvider;

/**
 * @category   Hps
 * @package    Hps_Transit
 * @copyright  Copyright (c) 2015 Heartland Payment Systems (https://www.magento.com)
 * @license    https://github.com/hps/transit-magento-extension/blob/master/LICENSE  Custom License
 */
class Hps_Transit_Helper_Data extends Mage_Core_Helper_Abstract
{
    const XML_PATH_PAYMENT_HPS_SECURESUBMIT_USE_HTTP_PROXY  = 'payment/hps_transit/use_http_proxy';
    const XML_PATH_PAYMENT_HPS_SECURESUBMIT_HTTP_PROXY_HOST = 'payment/hps_transit/http_proxy_host';
    const XML_PATH_PAYMENT_HPS_SECURESUBMIT_HTTP_PROXY_PORT = 'payment/hps_transit/http_proxy_port';
    const CONFIG_FORMAT = 'payment/hps_transit/%s';

    public function configureSDK($isTsep = false)
    {
        $config = new TransitConfig();

        $pairs = [
            'merchantId' => 'merchant_id',
            'username' => 'user_id',
            'password' => 'password',
            'deviceId' => $isTsep ? 'device_id_tsep' : 'device_id',
            'developerId' => 'developer_id',
            'transactionKey' => 'transaction_key',
        ];

        foreach ($pairs as $sdk => $mage) {
            $value = $this->getConfig($mage);

            if (empty($value)) {
                continue;
            }

            $config->{$sdk} = $value;
        }

        $config->environment = $this->getConfig('is_production') ? Environment::PRODUCTION : Environment::TEST;
        $config->acceptorConfig = new AcceptorConfig();
        $config->acceptorConfig->cardDataSource = CardDataSource::INTERNET;

        if ($this->isAdmin()) {
            $config->acceptorConfig->cardDataSource = CardDataSource::MAIL;
        }

        ServicesContainer::configureService($config);
    }

    public function getConfig($key)
    {
        return Mage::getStoreConfig(sprintf(self::CONFIG_FORMAT, $key));
    }

    /**
     * @param $customerId
     * @return Hps_Transit_Model_Storedcard[]|Hps_Transit_Model_Resource_Storedcard_Collection
     */
    public function getStoredCards($customerId)
    {
        $cardCollection = Mage::getResourceModel('hps_transit/storedcard_collection')
            ->addFieldToFilter('customer_id', $customerId);
        return $cardCollection;
    }

    /**
     * @param string        $token
     * @param HpsCreditCard $cardData
     * @param string        $cardType
     * @param integer|null  $customerId
     * @return Hps_Transit_Model_Storedcard
     */
    public function saveMultiToken($token,$cardData,$cardType, $customerId = null)
    {
        $_session = Mage::getSingleton('customer/session');
        $_loggedIn = $_session->isLoggedIn();

        if($_loggedIn || $customerId != null){
            if($customerId == null){
                $_customerId = $_session->getCustomer()->getId();
            }else{
                $_customerId = $customerId;
            }
            $storedCard = Mage::getModel('hps_transit/storedcard');
            $storedCard->setDt(Varien_Date::now())
                ->setCustomerId($_customerId)
                ->setTokenValue($token)
                ->setCcType($cardType)
                ->setCcLast4($cardData->number)
                ->setCcExpMonth(str_pad($cardData->expMonth, 2, '0', STR_PAD_LEFT))
                ->setCcExpYear($cardData->expYear);
            try{
                $storedCard->removeDuplicates();
                $storedCard->save();
                return $storedCard;
            }catch (Exception $e){
                if ($e->getCode() == '23000'){
                    Mage::throwException($this->__('Customer Not Found  : Card could not be saved.'));
                }
                Mage::throwException($e->getMessage());
            }
        }
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
}
