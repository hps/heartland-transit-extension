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
                'value' => 'A',
                'label' => 'Address matches, zip No Match'
            ),
            array(
                'value' => 'N',
                'label' => 'Neither address or zip code match'
            ),
            array(
                'value' => 'R',
                'label' => 'Retry - system unable to respond'
            ),
            array(
                'value' => 'S/U',
                'label' => 'AVS not supported'
            ),            
            array(
                'value' => 'Z/W',
                'label' => '9-digit zip code match, address no match'
            ),            
            array(
                'value' => 'X/Y',
                'label' => '5-digit zip code and address match'
            ),            
            array(
                'value' => 'G',
                'label' => 'Address not verified for International transaction'
            ),            
            array(
                'value' => 'B',
                'label' => 'Address match, Zip not verified'
            ),
            array(
                'value' => 'C',
                'label' => 'Address and zip mismatch'
            ),
            array(
                'value' => 'D',
                'label' => 'Address and zip match'
            ),
            array(
                'value' => 'I',
                'label' => 'AVS not verified for International transaction'
            ),
            array(
                'value' => 'M',
                'label' => 'Street address and postal code matches'
            ),
            array(
                'value' => 'P',
                'label' => 'Address and Zip not verified'
            )
        );
    }
}
