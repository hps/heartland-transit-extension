<?php
/**
 * @category   Hps
 * @package    Hps_Transit
 * @copyright  Copyright (c) 2015 Heartland Payment Systems (https://www.magento.com)
 * @license    https://github.com/hps/transit-magento-extension/blob/master/LICENSE  Custom License
 */

class Hps_Transit_Model_Source_PaymentAction
{
    public function toOptionArray()
    {
        return array(
            array(
                'value' => Mage_Payment_Model_Method_Abstract::ACTION_AUTHORIZE,
                'label' => 'Authorize'
            ),
            array(
                'value' => Mage_Payment_Model_Method_Abstract::ACTION_AUTHORIZE_CAPTURE,
                'label' => 'Authorize and Capture'
            ),
        );
    }
}
