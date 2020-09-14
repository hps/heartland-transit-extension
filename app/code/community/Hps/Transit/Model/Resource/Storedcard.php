<?php
/**
 * @category   Hps
 * @package    Hps_Transit
 * @copyright  Copyright (c) 2015 Heartland Payment Systems (https://www.magento.com)
 * @license    https://github.com/hps/transit-magento-extension/blob/master/LICENSE  Custom License
 */

class Hps_Transit_Model_Resource_Storedcard extends Mage_Core_Model_Resource_Db_Abstract{
    protected function _construct()
    {
        $this->_init('hps_transit/storedcard', 'storedcard_id');
    }

    public function removeDuplicates(Hps_Transit_Model_Storedcard $storedcard)
    {
        $this->_getWriteAdapter()->delete($this->getMainTable(), array(
            'customer_id = ?' => $storedcard->getCustomerId(),
            'token_value = ?' => $storedcard->getTokenValue()
        ));
    }
}
