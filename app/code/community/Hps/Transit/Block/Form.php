<?php
/**
 * @category   Hps
 * @package    Hps_Transit
 * @copyright  Copyright (c) 2015 Heartland Payment Systems (https://www.magento.com)
 * @license    https://github.com/hps/transit-magento-extension/blob/master/LICENSE  Custom License
 */

class Hps_Transit_Block_Form extends Mage_Payment_Block_Form_Ccsave
{
    protected $cca;

    protected function _construct()
    {
        parent::_construct();
        $this->setTemplate('transit/form.phtml');
    }

    protected function getConfig($key)
    {
        return Mage::getStoreConfig(sprintf('payment/hps_transit/%s', $key));
    }
}
