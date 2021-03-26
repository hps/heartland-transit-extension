<?php
/**
 * @category   Hps
 * @package    Hps_Transit
 * @copyright  Copyright (c) 2015 Heartland Payment Systems (https://www.magento.com)
 * @license    https://github.com/hps/transit-magento-extension/blob/master/LICENSE  Custom License
 */

class Hps_Transit_Model_Source_CvvResultCodes
{
    public function toOptionArray()
    {
        return array(
            array(
                'value' => 'N',
                'label' => 'Not Matching'
            ),
            array(
                'value' => 'P',
                'label' => 'Not Processed'
            ),
            array(
                'value' => 'S',
                'label' => 'Result not present'
            ),
            array(
                'value' => 'U',
                'label' => 'Issuer not certified'
            ),
            array(
                'value' => '?',
                'label' => 'CVV unrecognized'
            ),
        );
    }
}
