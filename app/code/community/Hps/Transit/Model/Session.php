<?php
/**
 * @category   Hps
 * @package    Hps_Transit
 * @copyright  Copyright (c) 2015 Heartland Payment Systems (https://www.magento.com)
 * @license    https://github.com/hps/transit-magento-extension/blob/master/LICENSE  Custom License
 */

/**
 *
 * Paypal transaction session namespace
 *
 * @author      Magento Core Team <core@magentocommerce.com>
 */
class Hps_Transit_Model_Session extends Mage_Core_Model_Session_Abstract
{
    public function __construct()
    {
        $this->init('hps_transit');
    }
}

