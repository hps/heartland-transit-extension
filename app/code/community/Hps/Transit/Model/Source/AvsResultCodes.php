<?php
/**
 * @category   Hps
 * @package    Hps_Transit
 * @copyright  Copyright (c) 2015 Heartland Payment Systems (https://www.magento.com)
 * @license    https://github.com/hps/transit-magento-extension/blob/master/LICENSE  Custom License
 */

class Hps_Transit_Model_Source_AvsResultCodes
{
    public function toOptionArray()
    {
        return array(
            array(
                'value' => 'D2018',
                'label' => 'AVS FAILED'
            ),
            array(
                'value' => 'D2027',
                'label' => 'AVS and CVV2 failed'
            ),            
        );
    }
}
