<?php
/**
 * @category   Hps
 * @package    Hps_Transit
 * @copyright  Copyright (c) 2015 Heartland Payment Systems (https://www.magento.com)
 * @license    https://github.com/hps/transit-magento-extension/blob/master/LICENSE  Custom License
 */

/**
 * @method Hps_Transit_Model_Resource_Storedcard getResource()
 * @method string getDt()
 * @method Hps_Transit_Model_Storedcard setDt(string $value)
 * @method int getCustomerId()
 * @method Hps_Transit_Model_Storedcard setCustomerId(int $value)
 * @method string getTokenValue()
 * @method Hps_Transit_Model_Storedcard setTokenValue(string $value)
 * @method string getCcType()
 * @method Hps_Transit_Model_Storedcard setCcType(string $value)
 * @method string getCcLast4()
 * @method Hps_Transit_Model_Storedcard setCcLast4(string $value)
 * @method string getCcExpMonth()
 * @method Hps_Transit_Model_Storedcard setCcExpMonth(string $value)
 * @method string getCcExpYear()
 * @method Hps_Transit_Model_Storedcard setCcExpYear(string $value)
 */
class Hps_Transit_Model_Storedcard  extends Mage_Core_Model_Abstract
{

    protected function _construct()
    {
        $this->_init('hps_transit/storedcard');
    }

    public function removeDuplicates()
    {
        $this->getResource()->removeDuplicates($this);
        return $this;
    }

}
