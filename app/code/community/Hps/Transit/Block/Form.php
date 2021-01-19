<?php

use GlobalPayments\Api\ServicesContainer;

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

    public function getCredentials()
    {
        Mage::helper('hps_transit/data')->configureSDK(true);

        $manifest = ServicesContainer::instance()->getClient('default')->createManifest();

        return json_encode([
            'deviceId' => $this->getConfig('device_id_tsep'),
            'manifest' => $manifest,
            'env' => $this->getConfig('is_production') ? 'production' : 'sandbox',
        ]);
    }

    protected function getConfig($key)
    {
        return Mage::getStoreConfig(sprintf('payment/hps_transit/%s', $key));
    }
}
