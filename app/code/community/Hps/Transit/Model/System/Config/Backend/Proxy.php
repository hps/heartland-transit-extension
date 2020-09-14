<?php
/**
 * @category   Hps
 * @package    Hps_Transit
 * @copyright  Copyright (c) 2015 Heartland Payment Systems (https://www.magento.com)
 * @license    https://github.com/hps/transit-magento-extension/blob/master/LICENSE  Custom License
 */

class Hps_Transit_Model_System_Config_Backend_Proxy extends Mage_Core_Model_Config_Data
{
    protected function _beforeSave()
    {
        if ($this->getFieldsetDataValue('use_http_proxy')) {
            $httpProxyHost = $this->getFieldsetDataValue('http_proxy_host');
            if (empty($httpProxyHost)) {
                Mage::throwException(Mage::helper('hps_transit')->__('HTTP Proxy Host is required for using proxy.'));
            }
            $httpProxyPort = $this->getFieldsetDataValue('http_proxy_port');
            if (empty($httpProxyPort)) {
                Mage::throwException(Mage::helper('hps_transit')->__('HTTP Proxy Port is required for using proxy.'));
            }
        }
    }
}
