<?php
/**
 * @category   Hps
 * @package    Hps_Transit
 * @copyright  Copyright (c) 2015 Heartland Payment Systems (https://www.magento.com)
 * @license    https://github.com/hps/transit-magento-extension/blob/master/LICENSE  Custom License
 */

class Hps_Transit_Model_Resource_Storedcard_Collection extends Mage_Core_Model_Resource_Db_Collection_Abstract {
    protected function _construct()
    {
        $this->_init('hps_transit/storedcard');
    }
}
