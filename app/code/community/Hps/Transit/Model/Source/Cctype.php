<?php
/**
 * @category   Hps
 * @package    Hps_Transit
 * @copyright  Copyright (c) 2015 Heartland Payment Systems (https://www.magento.com)
 * @license    https://github.com/hps/transit-magento-extension/blob/master/LICENSE  Custom License
 */

class Hps_Transit_Model_Source_Cctype extends Mage_Payment_Model_Source_Cctype
{
    protected $_allowedTypes = array('AE','VI','MC','DI','JCB','OT');

}
