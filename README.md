## TransIT Magento Payment Gateway

This extension allows Magento to use the Heartland Payment Systems Gateway. All card data is tokenized using Heartland's single-use tokenization solution.

## Installation

Example OpenMage LTS `composer.json`:

```json
{
    "minimum-stability": "dev",
    "prefer-stable": true,
    "require": {
        "aydin-hassan/magento-core-composer-installer": "*",
        "openmage/magento-lts": "19.4.6",
        "hps/hps_transit": "*"
    },
    "extra": {
        "magento-core-package-type": "magento-source",
        "magento-root-dir": "htdocs"
    }
}
```

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
