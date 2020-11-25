(function (window, document, undefined) {
  window.TransITMagentoAdmin = window.TransITMagentoAdmin || {};
  window.TransITMagentoAdmin.init = function () {
    window.TransITMagentoAdmin.observeOrderSubmit();

    var paymentMethod = $('p_method_hps_transit');
    if (paymentMethod && paymentMethod.checked) {
      window.TransITMagentoAdmin.loadLibrary(window.TransITMagentoAdmin.setupFields);
    } else {
      window.TransITMagentoAdmin.observePaymentSwitchMethod();
    }
  };
  window.TransITMagentoAdmin.setupFields = function () {
    if (!window.TransITMagentoAdmin.options) {
      return;
    }

    GlobalPayments.configure(window.TransITMagentoAdmin.options.credentials);

    window.TransITMagentoAdmin.cardForm = GlobalPayments.ui.form({
      fields: {
        "card-number": {
          target: window.TransITMagentoAdmin.options.iframeTargets.cardNumber,
          placeholder: '•••• •••• •••• ••••',
        },
        "card-expiration": {
          target: window.TransITMagentoAdmin.options.iframeTargets.cardExpiration,
          placeholder: 'MM / YYYY',
        },
        "card-cvv": {
          target: window.TransITMagentoAdmin.options.iframeTargets.cardCvv,
          placeholder: 'CVV',
        },
      },
      styles: {
        '#secure-payment-field': {
          height: '40px',
          border: '1px solid silver',
          'letter-spacing': '2.5px',
          width: '97.5%',
          'padding-left': '9px',
        },
        '#secure-payment-field:hover': {
          border: '1px solid #3989e3',
        },
        '#secure-payment-field:focus': {
          border: '1px solid #3989e3',
          'box-shadow': 'none',
          outline: 'none',
        },
        '#secure-payment-field[name="cardNumber"]': {
          background:
            'transparent url(' +
            window.TransITMagentoAdmin.options.baseUrl.replace('/index.php', '') +
            'skin/frontend/base/default/transit/images/ss-inputcard-blank@2x.png) no-repeat right',
          'background-size': '50px 30px',
        },
        '#secure-payment-field[name="cardNumber"].valid.card-type-visa': {
          background:
            'transparent url(' +
            window.TransITMagentoAdmin.options.baseUrl.replace('/index.php', '') +
            'skin/frontend/base/default/transit/images/ss-saved-visa@2x.png) no-repeat top right',
          'background-size': '75px 84px',
        },
        '#secure-payment-field[name="cardNumber"].invalid.card-type-visa': {
          background:
            'transparent url(' +
            window.TransITMagentoAdmin.options.baseUrl.replace('/index.php', '') +
            'skin/frontend/base/default/transit/images/ss-saved-visa@2x.png) no-repeat bottom right',
          'background-size': '75px 84px',
        },
        '#secure-payment-field[name="cardNumber"].invalid.card-type-discover': {
          background:
            'transparent url(' +
            window.TransITMagentoAdmin.options.baseUrl.replace('/index.php', '') +
            'skin/frontend/base/default/transit/images/ss-saved-discover@2x.png) no-repeat right',
          'background-size': '70px 74px',
          'background-position-y': '-35px',
        },
        '#secure-payment-field[name="cardNumber"].valid.card-type-discover': {
          background:
            'transparent url(' +
            window.TransITMagentoAdmin.options.baseUrl.replace('/index.php', '') +
            'skin/frontend/base/default/transit/images/ss-saved-discover@2x.png) no-repeat right',
          'background-size': '70px 74px',
          'background-position-y': '2px',
        },
        '#secure-payment-field[name="cardNumber"].invalid.card-type-amex': {
          background:
            'transparent url(' +
            window.TransITMagentoAdmin.options.baseUrl.replace('/index.php', '') +
            'skin/frontend/base/default/transit/images/ss-input-amex@2x.png) no-repeat center right',
          'background-size': '50px 55px',
        },
        '#secure-payment-field[name="cardNumber"].valid.card-type-amex': {
          background:
            'transparent url(' +
            window.TransITMagentoAdmin.options.baseUrl.replace('/index.php', '') +
            'skin/frontend/base/default/transit/images/ss-inputcard-amex@2x.png) no-repeat center right',
          'background-size': '50px 55px',
        },
        '#secure-payment-field[name="cardNumber"].invalid.card-type-jcb': {
          background:
            'transparent url(' +
            window.TransITMagentoAdmin.options.baseUrl.replace('/index.php', '') +
            'skin/frontend/base/default/transit/images/ss-saved-jcb@2x.png) no-repeat right',
          'background-size': '75px 75px',
          'background-position-y': '10px -35px',
        },
        '#secure-payment-field[name="cardNumber"].valid.card-type-jcb': {
          background:
            'transparent url(' +
            window.TransITMagentoAdmin.options.baseUrl.replace('/index.php', '') +
            'skin/frontend/base/default/transit/images/ss-saved-jcb@2x.png) no-repeat right',
          'background-size': '75px 76px',
          'background-position-y': '10px 2px',
        },
        '#secure-payment-field[name="cardNumber"].invalid.card-type-mastercard': {
          background:
            'transparent url(' +
            window.TransITMagentoAdmin.options.baseUrl.replace('/index.php', '') +
            'skin/frontend/base/default/transit/images/ss-saved-mastercard@2x.png) no-repeat bottom right',
          'background-size': '71px',
          'background-position-y': '-35px',
        },
        '#secure-payment-field[name="cardNumber"].valid.card-type-mastercard': {
          background:
            'transparent url(' +
            window.TransITMagentoAdmin.options.baseUrl.replace('/index.php', '') +
            'skin/frontend/base/default/transit/images/ss-saved-mastercard@2x.png) no-repeat top right',
          'background-size': '71px',
          'background-position-y': '3px',
        },
        '#secure-payment-field.card-cvv': {
          background:
            'transparent url(' +
            window.TransITMagentoAdmin.options.baseUrl.replace('/index.php', '') +
            'skin/frontend/base/default/transit/images/cvv1.png) no-repeat right',
          'background-size': '50px 30px',
        },
        '@media only screen and (max-width: 479px)': {
          '#secure-payment-field': {
            width: '95%',
          },
        },
      }
    });

    window.TransITMagentoAdmin.cardForm.on('token-success', window.order.secureSubmitSuccessHandler.bind(window.order));

    var onError = function(response) {
      if (response.error.message) {
        alert(response.error.message);
      } else {
        alert('Unexpected error.');
      }
    };

    window.TransITMagentoAdmin.cardForm.on('token-error', onError);
    GlobalPayments.on('error', onError);
  };
  window.TransITMagentoAdmin.triggerSubmit = function () {
    // manually include submit button
    const fields = ['submit'];
    const target = window.TransITMagentoAdmin.cardForm.frames['card-number'];

    for (const type in window.TransITMagentoAdmin.cardForm.frames) {
      if (window.TransITMagentoAdmin.cardForm.frames.hasOwnProperty(type)) {
        fields.push(type);
      }
    }

    for (const type in window.TransITMagentoAdmin.cardForm.frames) {
      if (!window.TransITMagentoAdmin.cardForm.frames.hasOwnProperty(type)) {
        continue;
      }

      const frame = window.TransITMagentoAdmin.cardForm.frames[type];

      if (!frame) {
        continue;
      }

      GlobalPayments.internal.postMessage.post({
        data: {
          fields: fields,
          target: target.id
        },
        id: frame.id,
        type: 'ui:iframe-field:request-data'
      }, frame.id);
    }
  };
  window.TransITMagentoAdmin.loadLibrary = function (cb) {
    if (window.GlobalPayments) {
      cb();
      return;
    }

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.defer = true;
    script.src = 'https://api2.heartlandportico.com/SecureSubmit.v1/token/gp-1.6.0/globalpayments.js';
    script.onload = cb;
    document.body.appendChild(script);
  };
  window.TransITMagentoAdmin.observeOrderSubmit = function () {
    if (typeof AdminOrder.prototype._secureSubmitOldSubmit === 'undefined') {
      var oldAdminOrder = Object.clone(AdminOrder.prototype);
      AdminOrder.prototype._secureSubmitOldSubmit = oldAdminOrder.submit;
    }

    Object.extend(AdminOrder.prototype, {
      submit: function() {
        if (this.paymentMethod != window.TransITMagentoAdmin.options.code) {
          this._secureSubmitOldSubmit();
          return;
        }

        // Use stored card checked, get existing token data
        if (this.secureSubmitUseStoredCard()) {
          // Set credit card information
          var creditCardId = $(window.TransITMagentoAdmin.options.code + '_stored_card_select').value;
          if (order.customerStoredCards[creditCardId]) {
            var creditCardData = order.customerStoredCards[creditCardId];
            $(window.TransITMagentoAdmin.options.code + '_expiration').value = parseInt(creditCardData.cc_exp_month);
            $(window.TransITMagentoAdmin.options.code + '_expiration_yr').value = creditCardData.cc_exp_year;
            $(window.TransITMagentoAdmin.options.code + '_token').value = creditCardData.token_value;
            $(window.TransITMagentoAdmin.options.code + '_cc_last_four').value = creditCardData.cc_last_four;
            this.secureSubmitSuccessHandler({
              paymentResponse:  creditCardData.token_value,
              details: {
                lastFour: creditCardData.cc_last_four
              }
            });
          }
        }
        // Use stored card not checked, get new token
        else {
            window.TransITMagentoAdmin.triggerSubmit();
        }
      },
      secureSubmitUseStoredCard: function () {
        var storedCheckbox = $(window.TransITMagentoAdmin.options.code + '_stored_card_checkbox');
        return storedCheckbox && storedCheckbox.checked;
      },
      secureSubmitSuccessHandler: function (resp) {
        $(window.TransITMagentoAdmin.options.code + '_token').value = resp.paymentReference;

        // TODO: throw error when exp date /cvv isn't available

        if (resp.details) {
          $(
            window.TransITMagentoAdmin.options.code + '_cc_last_four'
          ).value = resp.details.cardLast4;
          $(window.TransITMagentoAdmin.options.code + '_cc_type').value = resp.details.cardType;
          $(
            window.TransITMagentoAdmin.options.code + '_cc_exp_month'
          ).value = resp.details.expiryMonth.trim();
          $(
            window.TransITMagentoAdmin.options.code + '_cc_exp_year'
          ).value = resp.details.expiryYear.trim();
        }

        var that = this;
        window.TransITMagentoAdmin.cardForm.frames['card-cvv'].getCvv().then(function (c) {
          $(window.TransITMagentoAdmin.options.code + '_cc_cid').value = c;

          if (that.orderItemChanged) {
            if (confirm('You have item changes')) {
              if (editForm.submit()) {
                disableElements('save');
              }
            } else {
              that.itemsUpdate();
            }
          } else {
            if (that.secureSubmitUseStoredCard()) {
              if (editForm._submit()) {
                disableElements('save');
              }
            } else {
              if (editForm.submit()) {
                disableElements('save');
              }
            }
          }
        });
      }
    });
  };
  window.TransITMagentoAdmin.observePaymentSwitchMethod = function () {
    if (typeof payment._secureSubmitOldSwitchMethod === 'undefined') {
      var oldPayment = Object.clone(payment);
      payment._secureSubmitOldSwitchMethod = oldPayment.switchMethod;
    }

    var fieldsSetup = false;

    Object.extend(payment, {
      switchMethod: function (method) {
        payment._secureSubmitOldSwitchMethod(method);

        if (method !== 'hps_transit' || fieldsSetup) {
          return;
        }

        window.TransITMagentoAdmin.loadLibrary(window.TransITMagentoAdmin.setupFields);
        fieldsSetup = true;
      }
    });
  };

  document.observe('dom:loaded', function() {
    window.TransITMagentoAdmin.init();
  });
})(window, document);
