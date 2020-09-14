<?php
class Hps_Transit_Block_Adminhtml_Form extends Hps_Transit_Block_Form
{
    /**
     * Retrieve stored cards for the customer
     *
     * @return Hps_Transit_Model_Storedcard[]|Hps_Transit_Model_Resource_Storedcard_Collection
     */
    public function getCustomerStoredCards()
    {
        if ( ! Mage::app()->getStore()->isAdmin()) {
            return array();
        }
        if ( ! Mage::getSingleton('admin/session')->isAllowed('sales/order/actions/use_saved_card')) {
            return array();
        }
        if ( ! $customerId = Mage::getSingleton('adminhtml/session_quote')->getCustomerId()) {
            return array();
        }
        return Mage::helper('hps_transit')->getStoredCards($customerId);
    }

    /**
     * Retrieve customer stored credit cards JavaScript config
     *
     * @return array
     */
    public function getJsConfig()
    {
        $config = array();
        $collection = $this->getCustomerStoredCards();
        if (count($collection) === 0) {
            return $config;
        }

        foreach ($collection as $card) { /** @var $card Hps_Transit_Model_Storedcard */
            $config[$card->getId()] = array(
                'cc_exp_month' => $card->getCcExpMonth(),
                'cc_exp_year'  => $card->getCcExpYear(),
                'token_value'  => $card->getTokenValue(),
                'cc_last_four' => $card->getCcLast4(),
            );
        }
        return $config;
    }
}
