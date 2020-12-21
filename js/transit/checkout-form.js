if (!String.prototype.trim) {
  String.prototype.trim = function() {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

(function(window, document, _undefined) {
  var opcTokenSubmits = {};
  var THIS = {
    __data: {},
    skipCreditCard: false,
    init: function(options) {
      THIS.options = options;
      THIS.observeSavedCards();

      if (typeof Payment !== 'undefined') {
        window.payment = window.payment || {};
        payment.transitPublicKey = THIS.options.publicKey;
        payment.transitGetTokenDataUrl = THIS.options.tokenDataUrl;
      } else if (document.getElementById('multishipping-billing-form')) {
        THIS.transitMS = transitMultishipping(
          document.getElementById('multishipping-billing-form')
        );
        THIS.transitMS.transitPublicKey = THIS.options.publicKey;
        THIS.transitMS.transitGetTokenDataUrl =
          THIS.options.tokenDataUrl;
        document.observe('dom:loaded', function() {
          Event.observe('payment-continue', 'click', function(e) {
            Event.stop(e);
            THIS.transitMS.save();
          });
        });
      }

      if (typeof OPC !== 'undefined') {
        OPC.prototype.transitPublicKey = THIS.options.publicKey;
        OPC.prototype.transitGetTokenDataUrl = THIS.options.tokenDataUrl;
      }

      // MageStore OSC
      window.payment = window.payment || {};
      window.payment.transitPublicKeyOSC = THIS.options.publicKey;
      window.payment.transitGetTokenDataUrlOSC = THIS.options.tokenDataUrl;

      // IWD OPC
      if (typeof IWD !== 'undefined' && typeof IWD.OPC !== 'undefined') {
        IWD.OPC.transitPublicKey = THIS.options.publicKey;
        IWD.OPC.transitGetTokenDataUrl = THIS.options.tokenDataUrl;
      }

      // Latest Version of IWD One page Checkout
      if (
        typeof iwdOpcConfig !== 'undefined' &&
        typeof OnePage !== 'undefined' &&
        typeof PaymentMethod !== 'undefined'
      ) {
        PaymentMethod.prototype.transitPublicKey = THIS.options.publicKey;
        PaymentMethod.prototype.transitGetTokenDataUrl =
          THIS.options.tokenDataUrl;
      }

      // AheadWorks OneStepCheckout
      if (typeof AWOnestepcheckoutForm !== 'undefined') {
        AWOnestepcheckoutForm.prototype.transitPublicKey =
          THIS.options.publicKey;
        AWOnestepcheckoutForm.prototype.transitGetTokenDataUrl =
          THIS.options.tokenDataUrl;
      }

      THIS.setupFields();
    },
    observeSavedCards: function() {
      if (THIS.options.loggedIn && THIS.options.allowCardSaving) {
        $$('[name="' + THIS.options.code + '_stored_card_select"]').each(
          function(el) {
            $(el).observe('click', function() {
              if ($(THIS.options.code + '_stored_card_select_new').checked) {
                $(THIS.options.code + '_cc_form').show();
              } else {
                $(THIS.options.code + '_cc_form').hide();
              }

              if (!THIS.options.useIframes) {
                $(THIS.options.code + '_cc_number').toggleClassName(
                  'validate-cc-number'
                );
              }

              $$('[name="' + THIS.options.code + '_stored_card_select"]').each(
                function(element) {
                  $(element)
                    .up(2)
                    .removeClassName('active');
                }
              );

              $(el)
                .up(2)
                .addClassName('active');
            });
          }
        );
      }
    },
    setupFields: function() {
      GlobalPayments.configure(THIS.options.credentials);

      THIS.cardForm = GlobalPayments.ui.form({
        fields: {
          "card-number": {
            target: THIS.options.iframeTargets.cardNumber,
            placeholder: '•••• •••• •••• ••••',
          },
          "card-expiration": {
            target: THIS.options.iframeTargets.cardExpiration,
            placeholder: 'MM / YYYY',
          },
          "card-cvv": {
            target: THIS.options.iframeTargets.cardCvv,
            placeholder: 'CVV',
          },
        },
        styles: {
          '#secure-payment-field': {
            height: '40px',
            border: '1px solid silver',
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
              'white url(' +
              THIS.options.baseUrl.replace('/index.php', '') +
              'skin/frontend/base/default/transit/images/ss-inputcard-blank@2x.png) no-repeat right',
            'background-size': '50px 30px',
          },
          '#secure-payment-field[name="cardNumber"].valid.card-type-visa': {
            background:
              'white url(' +
              THIS.options.baseUrl.replace('/index.php', '') +
              'skin/frontend/base/default/transit/images/ss-saved-visa@2x.png) no-repeat top right',
            'background-size': '75px 84px',
          },
          '#secure-payment-field[name="cardNumber"].invalid.card-type-visa': {
            background:
              'white url(' +
              THIS.options.baseUrl.replace('/index.php', '') +
              'skin/frontend/base/default/transit/images/ss-saved-visa@2x.png) no-repeat bottom right',
            'background-size': '75px 84px',
          },
          '#secure-payment-field[name="cardNumber"].invalid.card-type-discover': {
            background:
              'white url(' +
              THIS.options.baseUrl.replace('/index.php', '') +
              'skin/frontend/base/default/transit/images/ss-saved-discover@2x.png) no-repeat right',
            'background-size': '70px 74px',
            'background-position-y': '-35px',
          },
          '#secure-payment-field[name="cardNumber"].valid.card-type-discover': {
            background:
              'white url(' +
              THIS.options.baseUrl.replace('/index.php', '') +
              'skin/frontend/base/default/transit/images/ss-saved-discover@2x.png) no-repeat right',
            'background-size': '70px 74px',
            'background-position-y': '2px',
          },
          '#secure-payment-field[name="cardNumber"].invalid.card-type-amex': {
            background:
              'white url(' +
              THIS.options.baseUrl.replace('/index.php', '') +
              'skin/frontend/base/default/transit/images/ss-input-amex@2x.png) no-repeat center right',
            'background-size': '50px 55px',
          },
          '#secure-payment-field[name="cardNumber"].valid.card-type-amex': {
            background:
              'white url(' +
              THIS.options.baseUrl.replace('/index.php', '') +
              'skin/frontend/base/default/transit/images/ss-inputcard-amex@2x.png) no-repeat center right',
            'background-size': '50px 55px',
          },
          '#secure-payment-field[name="cardNumber"].invalid.card-type-jcb': {
            background:
              'white url(' +
              THIS.options.baseUrl.replace('/index.php', '') +
              'skin/frontend/base/default/transit/images/ss-saved-jcb@2x.png) no-repeat right',
            'background-size': '75px 75px',
            'background-position-y': '10px -35px',
          },
          '#secure-payment-field[name="cardNumber"].valid.card-type-jcb': {
            background:
              'white url(' +
              THIS.options.baseUrl.replace('/index.php', '') +
              'skin/frontend/base/default/transit/images/ss-saved-jcb@2x.png) no-repeat right',
            'background-size': '75px 76px',
            'background-position-y': '10px 2px',
          },
          '#secure-payment-field[name="cardNumber"].invalid.card-type-mastercard': {
            background:
              'white url(' +
              THIS.options.baseUrl.replace('/index.php', '') +
              'skin/frontend/base/default/transit/images/ss-saved-mastercard@2x.png) no-repeat bottom right',
            'background-size': '71px',
            'background-position-y': '-35px',
          },
          '#secure-payment-field[name="cardNumber"].valid.card-type-mastercard': {
            background:
              'white url(' +
              THIS.options.baseUrl.replace('/index.php', '') +
              'skin/frontend/base/default/transit/images/ss-saved-mastercard@2x.png) no-repeat top right',
            'background-size': '71px',
            'background-position-y': '3px',
          },
          '#secure-payment-field.card-cvv': {
            background:
              'white url(' +
              THIS.options.baseUrl.replace('/index.php', '') +
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

      THIS.cardForm.on('token-success', function(resp) {
        // BEGIN: AheadWorks OneStepCheckout fix
        // This is required in order to work around a limitation with AW OSC and our
        // iframes' `message` event handler. Because of how AW OSC refreshes the payment
        // multiple times, mutiple event handlers for `message` are added, so the
        // `onTokenSuccess` event that we receive is firing multiple times which also
        // submits the form multiple times, attempting to create multiple orders.
        if (
          THIS.isOnePageCheckout() &&
          typeof opcTokenSubmits[resp.paymentReference] !== 'undefined'
        ) {
          return;
        }

        opcTokenSubmits[resp.paymentReference] = true;
        // END: AheadWorks OneStepCheckout fix

        $(THIS.options.code + '_token').value = resp.paymentReference;

        // TODO: throw error when exp date /cvv isn't available

        if (resp.details) {
          $(
            THIS.options.code + '_cc_last_four'
          ).value = resp.details.cardLast4;
          $(THIS.options.code + '_cc_type').value = resp.details.cardType;
          $(
            THIS.options.code + '_cc_exp_month'
          ).value = resp.details.expiryMonth.trim();
          $(
            THIS.options.code + '_cc_exp_year'
          ).value = resp.details.expiryYear.trim();
        }

        THIS.cardForm.frames["card-cvv"].getCvv().then(function (c) {
          $(THIS.options.code + '_cc_cid').value = c;
          THIS.completeCheckout();
        });
      });

      var onError = function(response) {
        if (THIS.skipCreditCard) {
          THIS.completeCheckout();
          return;
        }

        if (response.reasons && response.reasons.length > 0) {
          alert(response.reasons[0].message);
        } else {
          alert('Unexpected error.');
        }

        if (typeof Payment !== 'undefined' && window.checkout) {
          checkout.setLoadWaiting(false);
        } else if (typeof OPC !== 'undefined' && window.checkout) {
          checkout.setLoadWaiting(false);
        } else if (
          typeof iwdOpcConfig !== 'undefined' &&
          typeof OnePage !== 'undefined' &&
          typeof PaymentMethod !== 'undefined'
        ) {
          $ji('.iwd_opc_loader_wrapper.active').hide();
        }

        if (window.awOSCForm) {
          form.enablePlaceOrderButton();
          form.hidePleaseWaitNotice();
          form.hideOverlay();
        }
      };

      THIS.cardForm.on('token-error', onError);
      GlobalPayments.on('error', onError);

      if (document.getElementById('amscheckout-onepage')) {
        var ssbanner = document.getElementById('ss-banner');
        var ccnumber = document.getElementById('cc-number');
        var expirationdate = document.getElementById('expiration-dat');
        var ccv = document.getElementById('payment-buttons-container');

        if (ssbanner) {
          ssbanner.style.backgroundSize = '325px 40px';
        }
        if (ccnumber) {
          ccnumber.className = 'transit_amasty_one_page_checkout';
        }
        if (expirationdate) {
          expirationdate.className = 'transit_amasty_one_page_checkout';
        }
        if (ccv) {
          ccv.className = 'transit_amasty_one_page_checkout';
        }
      }
    },
    triggerSubmit: function () {
      // manually include submit button
      const fields = ['submit'];
      const target = THIS.cardForm.frames['card-number'];

      for (const type in THIS.cardForm.frames) {
        if (THIS.cardForm.frames.hasOwnProperty(type)) {
          fields.push(type);
        }
      }

      for (const type in THIS.cardForm.frames) {
        if (!THIS.cardForm.frames.hasOwnProperty(type)) {
          continue;
        }

        const frame = THIS.cardForm.frames[type];

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
    },
    isOnePageCheckout: function() {
      return (
        typeof OPC !== 'undefined' ||
        (typeof IWD !== 'undefined' && typeof IWD.OPC !== 'undefined') ||
        (typeof iwdOpcConfig !== 'undefined' &&
          typeof OnePage !== 'undefined' &&
          typeof PaymentMethod !== 'undefined') ||
        window.transitAmastyCompleteCheckoutOriginal ||
        window.oscPlaceOrderOriginal ||
        window.awOSCForm
      );
    },
    completeCheckout: function() {
      if (typeof OPC !== 'undefined') {
        checkout.setLoadWaiting(true);
        new Ajax.Request(checkout.saveUrl, {
          method: 'post',
          parameters: Form.serialize(checkout.form),
          onSuccess: checkout.setResponse.bind(checkout),
          onFailure: checkout.ajaxFailure.bind(checkout),
        });
      } else if (typeof IWD !== 'undefined' && typeof IWD.OPC !== 'undefined') {
        IWD.OPC.Checkout.xhr = $j_opc.post(
          IWD.OPC.Checkout.config.baseUrl + 'onepage/json/savePayment',
          $j_opc('#co-payment-form').serializeArray(),
          IWD.OPC.preparePaymentResponse,
          'json'
        );
      } else if (
        typeof iwdOpcConfig !== 'undefined' &&
        typeof OnePage !== 'undefined' &&
        typeof PaymentMethod !== 'undefined'
      ) {
        $ji('.iwd_opc_loader_wrapper.active').show();
        Singleton.get(OnePage).saveOrder();
      } else if (window.transitAmastyCompleteCheckoutOriginal) {
        transitAmastyCompleteCheckoutOriginal();
      } else if (window.oscPlaceOrderOriginal) {
        $('onestepcheckout-place-order-loading').show();
        $('onestepcheckout-button-place-order').removeClassName(
          'onestepcheckout-btn-checkout'
        );
        $('onestepcheckout-button-place-order').addClassName(
          'place-order-loader'
        );
        oscPlaceOrderOriginal(THIS.__data.btn);
      } else if (typeof Payment !== 'undefined') {
        new Ajax.Request(payment.saveUrl, {
          method: 'post',
          parameters: Form.serialize(payment.form),
          onComplete: payment.onComplete,
          onSuccess: payment.onSave,
          onFailure: checkout.ajaxFailure.bind(checkout),
        });
      } else if (document.getElementById('multishipping-billing-form')) {
        document.getElementById('payment-continue').enable();
        document.getElementById('multishipping-billing-form').submit();
      } else if (window.awOSCForm) {
        awOSCForm._transitOldPlaceOrder();
      }
    },
    useStoredCard: function() {
      var newRadio = $('hps_transit_stored_card_select_new');
      return !newRadio.checked;
    },
  };
  window.TransITMagento = THIS;

  $(document).on(
    'change',
    '#aw-onestepcheckout-payment-method #checkout-payment-method-load input[type=radio]',
    function() {
      if (
        document.getElementById('p_method_hps_transit').checked == true
      ) {
        ClearValue();
      }
      if (
        document.getElementById('hps_transit_stored_card_select_1')
          .checked == true &&
        document.getElementById('p_method_hps_transit').checked == true
      ) {
        ClearValue();
      }
      if (
        document.getElementById('hps_transit_stored_card_select_new')
          .checked == true &&
        document.getElementById('p_method_hps_transit').checked == true
      ) {
        ClearValue();
      }
    }
  );

  function ClearValue() {
    document.getElementById('hps_transit_cc_number').value = '';
    document.getElementById('hps_transit_exp_date').value = '';
    document.getElementById('hps_transit_cvv_number').value = '';
  }
})(window, window.document);

function transitMultishipping(multiForm) {
  var transit = {
    save: function() {
      if (payment && payment.currentMethod != 'hps_transit') {
        multiForm.submit();
        return;
      }

      document.getElementById('payment-continue').disable();

      // Use stored card checked, get existing token data
      if (this.transitUseStoredCard()) {
        var radio = $$(
          '[name="hps_transit_stored_card_select"]:checked'
        )[0];
        var storedcardId = radio.value;
        var storedcardType = $(radio.id + '_card_type').value;

        new Ajax.Request(this.transitGetTokenDataUrl, {
          method: 'post',
          parameters: {storedcard_id: storedcardId},
          onSuccess: function(response) {
            var data = response.responseJSON;
            if (data && data.token) {
              $('hps_transit_cc_exp_month').value = parseInt(
                data.token.cc_exp_month
              );
              $('hps_transit_cc_exp_year').value = data.token.cc_exp_year;
            }
            this.transitResponseHandler.call(this, {
              card_type: storedcardType,
              token_value: data.token.token_value,
              token_type: null, // 'supt'?
              token_expire: new Date().toISOString(),
              card: {
                number: data.token.cc_last4,
              },
            });
          }.bind(this),
          onFailure: function() {
            alert('Unknown error. Please try again.');
          },
        });
      } else {
        // Use stored card not checked, get new token
        TransITMagento.triggerSubmit();
      }
    },
    transitUseStoredCard: function() {
      var newRadio = $('hps_transit_stored_card_select_new');
      return !newRadio.checked;
    },
    transitResponseHandler: function(response) {
      var tokenField = $('hps_transit_token'),
        typeField = $('hps_transit_cc_type'),
        lastFourField = $('hps_transit_cc_last_four');
      tokenField.value = typeField.value = lastFourField.value = null;

      if (
        $('hps_transit_exp_date') &&
        $('hps_transit_exp_date').value
      ) {
        var date = $('hps_transit_exp_date').value.split('/');
        $('hps_transit_cc_exp_month').value = date[0].trim();
        $('hps_transit_cc_exp_year').value = date[1].trim();
      }

      if (TransITMagento.skipCreditCard) {
        TransITMagento.completeCheckout();
        return;
      }

      if (response && response.error) {
        if (response.reasons && response.reasons.length > 0) {
          alert(response.reasons[0].message);
        }
      } else if (response && response.token_value) {
        tokenField.value = response.token_value;
        lastFourField.value = response.card.number.substr(-4);
        typeField.value = response.card_type;

        // Continue Magento checkout steps
        document.getElementById('payment-continue').enable();
        multiForm.submit();
      } else {
        alert('Unexpected error.');
      }
    },
  };
  return transit;
}
var transitAmastyCompleteCheckoutOriginal;

// AheadWorks OneStepCheckout
Event.observe(document, 'aw_osc:onestepcheckout_form_init_before', function(e) {
  var form = e.memo.form;
  var oldAwOsc = Object.clone(form);
  form._transitOldPlaceOrder = oldAwOsc.placeOrder;

  form.placeOrder = function() {
    var checkedPaymentMethod = $$(
      '[name="' + awOSCForm.paymentMethodName + '"]:checked'
    );
    if (
      checkedPaymentMethod.length !== 1 ||
      checkedPaymentMethod[0].value !== 'hps_transit'
    ) {
      this._transitOldPlaceOrder();
      return;
    }

    // Use stored card checked, get existing token data
    if (window.TransITMagento.useStoredCard()) {
      var radio = $$('[name="hps_transit_stored_card_select"]:checked')[0];
      var storedcardId = radio.value;
      var storedcardType = $(radio.id + '_card_type').value;
      new Ajax.Request(form.transitGetTokenDataUrl, {
        method: 'post',
        parameters: {storedcard_id: storedcardId},
        onSuccess: function(response) {
          var data = response.responseJSON;
          if (data && data.token) {
            $('hps_transit_cc_exp_month').value = parseInt(
              data.token.cc_exp_month
            );
            $('hps_transit_cc_exp_year').value = data.token.cc_exp_year;
          }
          this.transitResponseHandler.call(this, {
            card_type: storedcardType,
            token_value: data.token.token_value,
            token_type: null, // 'supt'?
            token_expire: new Date().toISOString(),
            card: {
              number: data.token.cc_last4,
            },
          });
        }.bind(form),
        onFailure: function() {
          alert('Unknown error. Please try again.');
          form.enablePlaceOrderButton();
          form.hidePleaseWaitNotice();
          form.hideOverlay();
        },
      });
    } else {
      // Use stored card not checked, get new token
      if (window.TransITMagento.options.useIframes) {
        window.TransITMagento.triggerSubmit();
      } else {
        if (
          $('hps_transit_exp_date') &&
          $('hps_transit_exp_date').value
        ) {
          var date = $('hps_transit_exp_date').value.split('/');
          $('hps_transit_cc_exp_month').value = date[0].trim();
          $('hps_transit_cc_exp_year').value = date[1].trim();
        }

        new Heartland.HPS({
          publicKey: form.transitPublicKey,
          cardNumber: $('hps_transit_cc_number').value,
          cardCvv: $('hps_transit_cvv_number').value,
          cardExpMonth: $('hps_transit_cc_exp_month').value,
          cardExpYear: $('hps_transit_cc_exp_year').value,
          success: form.transitResponseHandler.bind(form),
          error: form.transitResponseHandler.bind(form),
        }).tokenize();
      }
    }
  };

  form.transitResponseHandler = function(response) {
    var tokenField = $('hps_transit_token'),
      typeField = $('hps_transit_cc_type'),
      lastFourField = $('hps_transit_cc_last_four');
    tokenField.value = typeField.value = lastFourField.value = null;

    if (
      $('hps_transit_exp_date') &&
      $('hps_transit_exp_date').value
    ) {
      var date = $('hps_transit_exp_date').value.split('/');
      $('hps_transit_cc_exp_month').value = date[0].trim();
      $('hps_transit_cc_exp_year').value = date[1].trim();
    }

    if (window.TransITMagento.skipCreditCard) {
      window.TransITMagento.completeCheckout();
      return;
    }

    if (response && response.error) {
      if (response.reasons && response.reasons.length > 0) {
        alert(response.reasons[0].message);
      }
      this.enablePlaceOrderButton();
      this.hidePleaseWaitNotice();
      this.hideOverlay();
    } else if (response && response.token_value) {
      tokenField.value = response.token_value;
      lastFourField.value = response.card.number.substr(-4);
      typeField.value = response.card_type;

      // Continue Magento checkout steps
      form._transitOldPlaceOrder();
    } else {
      alert('Unexpected error.');
    }
  };
});

document.observe('dom:loaded', function() {
  // Override default Payment save handler
  if (typeof Payment !== 'undefined') {
    if (typeof Payment.prototype._transitOldSave === 'undefined') {
      var oldPayment = Object.clone(Payment.prototype);
      Payment.prototype._transitOldSave = oldPayment.save;
    }
    Object.extend(Payment.prototype, {
      save: function() {
        if (this.currentMethod != 'hps_transit') {
          this._transitOldSave();
          return;
        }

        if (checkout.loadWaiting !== false) return;

        // Use stored card checked, get existing token data
        if (this.transitUseStoredCard()) {
          var radio = $$(
            '[name="hps_transit_stored_card_select"]:checked'
          )[0];
          var storedcardId = radio.value;
          var storedcardType = $(radio.id + '_card_type').value;
          checkout.setLoadWaiting('payment');
          new Ajax.Request(this.transitGetTokenDataUrl, {
            method: 'post',
            parameters: {storedcard_id: storedcardId},
            onSuccess: function(response) {
              var data = response.responseJSON;
              if (data && data.token) {
                $('hps_transit_cc_exp_month').value = parseInt(
                  data.token.cc_exp_month
                );
                $('hps_transit_cc_exp_year').value =
                  data.token.cc_exp_year;
              }
              $('hps_transit_use_stored_card').value = "1";
              this.transitResponseHandler.call(this, {
                card_type: storedcardType,
                token_value: data.token.token_value,
                token_type: null, // 'supt'?
                token_expire: new Date().toISOString(),
                card: {
                  number: data.token.cc_last4,
                },
              });
            }.bind(this),
            onFailure: function() {
              alert('Unknown error. Please try again.');
              checkout.setLoadWaiting(false);
            },
          });
        } else {
          // Use stored card not checked, get new token
          if (TransITMagento.options.useIframes) {
            checkout.setLoadWaiting('payment');
            TransITMagento.triggerSubmit();
          } else {
            var validator = new Validation(this.form);
            if (this.validate() && validator.validate()) {
              checkout.setLoadWaiting('payment');

              if (
                $('hps_transit_exp_date') &&
                $('hps_transit_exp_date').value
              ) {
                var date = $('hps_transit_exp_date').value.split('/');
                $('hps_transit_cc_exp_month').value = date[0].trim();
                $('hps_transit_cc_exp_year').value = date[1].trim();
              }

              new Heartland.HPS({
                publicKey: this.transitPublicKey,
                cardNumber: $('hps_transit_cc_number').value,
                cardCvv: $('hps_transit_cvv_number').value,
                cardExpMonth: $('hps_transit_cc_exp_month').value,
                cardExpYear: $('hps_transit_cc_exp_year').value,
                success: this.transitResponseHandler.bind(this),
                error: this.transitResponseHandler.bind(this),
              }).tokenize();
            }
          }
        }
      },
      transitUseStoredCard: function() {
        var newRadio = $('hps_transit_stored_card_select_new');
        return !newRadio.checked;
      },
      transitResponseHandler: function(response) {
        var tokenField = $('hps_transit_token'),
          typeField = $('hps_transit_cc_type'),
          lastFourField = $('hps_transit_cc_last_four');
        tokenField.value = typeField.value = lastFourField.value = null;

        if (
          $('hps_transit_exp_date') &&
          $('hps_transit_exp_date').value
        ) {
          var date = $('hps_transit_exp_date').value.split('/');
          $('hps_transit_cc_exp_month').value = date[0].trim();
          $('hps_transit_cc_exp_year').value = date[1].trim();
        }

        if (TransITMagento.skipCreditCard) {
          TransITMagento.completeCheckout();
          return;
        }

        if (response && response.error) {
          if (response.reasons && response.reasons.length > 0) {
            alert(response.reasons[0].message);
          }
          checkout.setLoadWaiting(false);
        } else if (response && response.token_value) {
          tokenField.value = response.token_value;
          lastFourField.value = response.card.number.substr(-4);
          typeField.value = response.card_type;

          // Continue Magento checkout steps
          new Ajax.Request(this.saveUrl, {
            method: 'post',
            onComplete: this.onComplete,
            onSuccess: this.onSave,
            onFailure: checkout.ajaxFailure.bind(checkout),
            parameters: Form.serialize(this.form),
          });
        } else {
          alert('Unexpected error.');
        }
      },
    });
  }

  if (typeof OPC !== 'undefined') {
    if (typeof OPC.prototype._transitOldSubmit === 'undefined') {
      var oldOPC = Object.clone(OPC.prototype);
      OPC.prototype._transitOldSubmit = oldOPC.submit;
    }
    Object.extend(OPC.prototype, {
      save: function() {
        if (this.sectionsToValidate[0].currentMethod != 'hps_transit') {
          this._transitOldSubmit();
          return;
        }

        TransITMagento.triggerSubmit();
      },
      transitResponseHandler: function(response) {
        var tokenField = $('hps_transit_token'),
          typeField = $('hps_transit_cc_type'),
          lastFourField = $('hps_transit_cc_last_four');
        tokenField.value = typeField.value = lastFourField.value = null;

        if (
          $('hps_transit_exp_date') &&
          $('hps_transit_exp_date').value
        ) {
          var date = $('hps_transit_exp_date').value.split('/');
          $('hps_transit_cc_exp_month').value = date[0].trim();
          $('hps_transit_cc_exp_year').value = date[1].trim();
        }

        if (TransITMagento.skipCreditCard) {
          TransITMagento.completeCheckout();
          return;
        }

        if (response && response.error) {
          if (response.reasons && response.reasons.length > 0) {
            alert(response.reasons[0].message);
          }
          checkout.setLoadWaiting(false);
        } else if (response && response.token_value) {
          tokenField.value = response.token_value;
          typeField.value = response.card_type;
          lastFourField.value = response.card.number.substr(-4);
          typeField.value = response.card_type;

          this.setLoadWaiting(true);
          var params = Form.serialize(this.form);
          new Ajax.Request(this.saveUrl, {
            method: 'post',
            parameters: params,
            onSuccess: this.setResponse.bind(this),
            onFailure: this.ajaxFailure.bind(this),
          });
        } else {
          alert('Unexpected error.');
        }
      },
    });
  }

  var cloneFunction = function(that) {
    var temp = function temporary() {
      return that.apply(this, arguments);
    };
    for (var key in this) {
      if (this.hasOwnProperty(key)) {
        temp[key] = this[key];
      }
    }
    return temp;
  };
  // Amasty completeCheckout();

  if (
    typeof window.completeCheckout === 'function' &&
    document.getElementById('amscheckout-onepage')
  ) {
    transitAmastyCompleteCheckoutOriginal = cloneFunction(
      completeCheckout
    );

    try {
      var ele;
      ele = document.createElement('div');
      ele.id = 'co-payment-form-update';
      var pEle = document.querySelector(
        '#amscheckout-main > div.amscheckout > div > div.second-column > div:nth-child(3) > div.payment-method'
      );
      pEle.insertBefore(ele, pEle.childNodes[2]);
    } catch (e) {}
    var container = document.getElementById('payment-buttons-container');
    if (container && container.parentNode) {
      // container.parentNode should always exist, but we're playing it safe above
      container.parentNode.removeChild(container);
    }

    window.completeCheckout = function(btn) {
      var validator = new Validation('amscheckout-onepage');

      if (validator.validate()) {
        var currentPayment = payment.currentMethod;
        if (currentPayment != 'hps_transit') {
          transitAmastyCompleteCheckoutOriginal(btn);
          return;
        }

        if (
          $('hps_transit_exp_date') &&
          $('hps_transit_exp_date').value
        ) {
          var date = $('hps_transit_exp_date').value.split('/');
          $('hps_transit_cc_exp_month').value = date[0].trim();
          $('hps_transit_cc_exp_year').value = date[1].trim();
        }

        if (transitUseStoredCardAOSC()) {
          var radio = $$(
            '[name="hps_transit_stored_card_select"]:checked'
          )[0];
          $('hps_transit_use_stored_card').value = "1";
          var storedcardId = radio.value;
          var storedcardType = $(radio.id + '_card_type').value;
          new Ajax.Request(window.payment.transitGetTokenDataUrlOSC, {
            method: 'post',
            parameters: {storedcard_id: storedcardId},
            onSuccess: function(response) {
              var data = response.responseJSON;
              transitResponseHandlerAOSC(
                {
                  card_type: storedcardType,
                  token_value: data.token.token_value,
                  token_type: null, // 'supt'?
                  token_expire: new Date().toISOString(),
                  card: {
                    number: data.token.cc_last4,
                  },
                },
                btn
              );
            },
            onFailure: function() {
              alert('Unknown error. Please try again.');
            },
          });
        } else {
          TransITMagento.triggerSubmit();
        }
      }
    };

    window.transitUseStoredCardAOSC = function() {
      var newRadio = $('hps_transit_stored_card_select_new');
      return !newRadio.checked;
    };

    window.transitResponseHandlerAOSC = function(response, btn) {
      var tokenField = $('hps_transit_token'),
        typeField = $('hps_transit_cc_type'),
        lastFourField = $('hps_transit_cc_last_four');
      tokenField.value = typeField.value = lastFourField.value = null;

      if (
        $('hps_transit_exp_date') &&
        $('hps_transit_exp_date').value
      ) {
        var date = $('hps_transit_exp_date').value.split('/');
        $('hps_transit_cc_exp_month').value = date[0].trim();
        $('hps_transit_cc_exp_year').value = date[1].trim();
      }

      if (TransITMagento.skipCreditCard) {
        TransITMagento.completeCheckout();
        return;
      }

      if (response && response.error) {
        if (response.reasons && response.reasons.length > 0) {
          alert(response.reasons[0].message);
        }
      } else if (response && response.token_value) {
        tokenField.value = response.token_value;
        lastFourField.value = response.card.number.substr(-4);
        typeField.value = response.card_type;

        transitAmastyCompleteCheckoutOriginal(btn);
      } else {
        alert('Unexpected error.');
      }
    };
  }

  // MageStore One Step Checkout
  if (typeof window.oscPlaceOrder === 'function') {
    window.oscPlaceOrderOriginal = cloneFunction(oscPlaceOrder);
    window.oscPlaceOrder = function(btn) {
      var validator = new Validation('one-step-checkout-form');
      var form = $('one-step-checkout-form');
      TransITMagento.__data.btn = btn;
      if (validator.validate()) {
        var currentPayment = $RF(form, 'payment[method]');
        if (currentPayment != 'hps_transit') {
          oscPlaceOrderOriginal(btn);
          return;
        }
        $('onestepcheckout-place-order-loading').hide();
        $('onestepcheckout-button-place-order').removeClassName(
          'place-order-loader'
        );
        $('onestepcheckout-button-place-order').addClassName(
          'onestepcheckout-btn-checkout'
        );
        if (transitUseStoredCardOSC()) {
          var radio = $$(
            '[name="hps_transit_stored_card_select"]:checked'
          )[0];
          $('hps_transit_use_stored_card').value = "1";
          var storedcardId = radio.value;
          var storedcardType = $(radio.id + '_card_type').value;
          new Ajax.Request(window.payment.transitGetTokenDataUrlOSC, {
            method: 'post',
            parameters: {storedcard_id: storedcardId},
            onSuccess: function(response) {
              var data = response.responseJSON;
              if (data && data.token) {
                $('hps_transit_cc_exp_month').value = parseInt(
                  data.token.cc_exp_month
                );
                $('hps_transit_cc_exp_year').value =
                  data.token.cc_exp_year;
              }
              transitResponseHandlerOSC(
                {
                  card_type: storedcardType,
                  token_value: data.token.token_value,
                  token_type: null, // 'supt'?
                  token_expire: new Date().toISOString(),
                  card: {
                    number: data.token.cc_last4,
                  },
                },
                btn
              );
            },
            onFailure: function() {
              alert('Unknown error. Please try again.');
              $('onestepcheckout-place-order-loading').show();
              $('onestepcheckout-button-place-order').removeClassName(
                'onestepcheckout-btn-checkout'
              );
              $('onestepcheckout-button-place-order').addClassName(
                'place-order-loader'
              );
            },
          });
        } else {
          TransITMagento.triggerSubmit();
        }
      }
    };

    window.transitUseStoredCardOSC = function() {
      var newRadio = $('hps_transit_stored_card_select_new');
      return !newRadio.checked;
    };

    window.transitResponseHandlerOSC = function(response, btn) {
      var tokenField = $('hps_transit_token'),
        typeField = $('hps_transit_cc_type'),
        lastFourField = $('hps_transit_cc_last_four');
      tokenField.value = typeField.value = lastFourField.value = null;

      if (
        $('hps_transit_exp_date') &&
        $('hps_transit_exp_date').value
      ) {
        var date = $('hps_transit_exp_date').value.split('/');
        $('hps_transit_cc_exp_month').value = date[0].trim();
        $('hps_transit_cc_exp_year').value = date[1].trim();
      }

      if (TransITMagento.skipCreditCard) {
        TransITMagento.completeCheckout();
        return;
      }

      if (response && response.error) {
        if (response.reasons && response.reasons.length > 0) {
          alert(response.reasons[0].message);
        }

        $('onestepcheckout-place-order-loading').hide();
        $('onestepcheckout-button-place-order').removeClassName(
          'place-order-loader'
        );
        $('onestepcheckout-button-place-order').addClassName(
          'onestepcheckout-btn-checkout'
        );
      } else if (response && response.token_value) {
        tokenField.value = response.token_value;
        lastFourField.value = response.card.number.substr(-4);
        typeField.value = response.card_type;

        $('onestepcheckout-place-order-loading').show();
        $('onestepcheckout-button-place-order').removeClassName(
          'onestepcheckout-btn-checkout'
        );
        $('onestepcheckout-button-place-order').addClassName(
          'place-order-loader'
        );

        // Continue Magento checkout steps
        oscPlaceOrderOriginal(btn);
      } else {
        alert('Unexpected error.');
        $('onestepcheckout-place-order-loading').show();
        $('onestepcheckout-button-place-order').removeClassName(
          'onestepcheckout-btn-checkout'
        );
        $('onestepcheckout-button-place-order').addClassName(
          'place-order-loader'
        );
      }
    };
  }

  // IWD OPC
  if (typeof IWD !== 'undefined' && typeof IWD.OPC !== 'undefined') {
    if (typeof IWD.OPC._transitOldSavePayment === 'undefined') {
      var oldIWDOPC = Object.clone(IWD.OPC);
      IWD.OPC._transitOldSavePayment = oldIWDOPC.savePayment;
    }
    Object.extend(IWD.OPC, {
      savePayment: function() {
        if (payment.currentMethod != 'hps_transit') {
          this._transitOldSavePayment();
          return;
        }

        if (!this.saveOrderStatus) {
          return;
        }

        TransITMagento.triggerSubmit();
      },
      transitResponseHandler: function(response) {
        var tokenField = $('hps_transit_token'),
          typeField = $('hps_transit_cc_type'),
          lastFourField = $('hps_transit_cc_last_four');
        tokenField.value = typeField.value = lastFourField.value = null;

        if (
          $('hps_transit_exp_date') &&
          $('hps_transit_exp_date').value
        ) {
          var date = $('hps_transit_exp_date').value.split('/');
          $('hps_transit_cc_exp_month').value = date[0].trim();
          $('hps_transit_cc_exp_year').value = date[1].trim();
        }

        if (TransITMagento.skipCreditCard) {
          TransITMagento.completeCheckout();
          return;
        }

        if (response && response.error) {
          IWD.OPC.Checkout.hideLoader();
          IWD.OPC.Checkout.xhr = null;
          IWD.OPC.Checkout.unlockPlaceOrder();
          alert(response.reasons[0].message);
        } else if (response && response.token_value) {
          tokenField.value = response.token_value;
          lastFourField.value = response.card.number.substr(-4);
          typeField.value = response.card_type;

          var form = $j_opc('#co-payment-form').serializeArray();
          IWD.OPC.Checkout.xhr = $j_opc.post(
            IWD.OPC.Checkout.config.baseUrl + 'onepage/json/savePayment',
            form,
            IWD.OPC.preparePaymentResponse,
            'json'
          );
        } else {
          IWD.OPC.Checkout.hideLoader();
          IWD.OPC.Checkout.xhr = null;
          IWD.OPC.Checkout.unlockPlaceOrder();
          alert('Unexpected error.');
        }
      },
    });
  }

  // Latest Version of IWD One page Checkout
  if (
    typeof iwdOpcConfig !== 'undefined' &&
    typeof OnePage !== 'undefined' &&
    typeof PaymentMethod !== 'undefined'
  ) {
    PaymentMethod.prototype.initPaymentMethods = function() {
      Singleton.get(PaymentMethodIWD).init();
    };

    PaymentMethod.prototype.saveSection = function() {
      var _this = this;
      var _thisArguments = arguments;
      _this.showLoader(Singleton.get(OnePage).sectionContainer);

      if (_this.getPaymentMethodCode() !== Singleton.get(PaymentMethodIWD).code) {
        OnePage.prototype.saveSection.apply(_this, _thisArguments);
        return;
      }

      Singleton.get(PaymentMethodIWD).originalThis = _this;
      Singleton.get(PaymentMethodIWD).originalArguments = _thisArguments;
      Singleton.get(PaymentMethodIWD).savePayment();
    };

    function PaymentMethodIWD() {
      PaymentMethod.apply(this);
      this.name = 'payment_method_hps_transit';
      this.paymentForm = null;
      this.code = 'hps_transit';
      this.originalThis = null;
      this.originalArguments = null;
      this.saveOrderInProgress = false;
    }

    PaymentMethodIWD.prototype = Object.create(PaymentMethod.prototype);
    PaymentMethodIWD.prototype.constructor = PaymentMethodIWD;

    PaymentMethodIWD.prototype.init = function() {
      // Displaying Card datas
      var code = $ji('#iwd_opc_payment_method_select').val();
      if (code == 'hps_transit') {
        $ji(
          '.iwd_opc_payment_method_forms .iwd_opc_payment_method_form ul#payment_form_hps_transit'
        ).show();
      }
      this.initChangeCard();
      this.saveUrl = this.config.savePaymentUrl;
    };

    PaymentMethodIWD.prototype.initChangeCard = function() {
      var _this = this;
      $ji(document).on(
        'change',
        _this.sectionContainer + ' #iwd_opc_payment_method_select',
        function() {
          var code = $ji(this).val();
          if (code == 'hps_transit') {
            $ji(
              _this.sectionContainer +
                ' .iwd_opc_payment_method_forms .iwd_opc_payment_method_form ul#payment_form_hps_transit'
            ).show();
            setTimeout(function() {
              $ji('ul#payment_form_hps_transit .validation-advice').hide();
            }, 100);
          }
        }
      );
    };

    PaymentMethodIWD.prototype.getSaveData = function() {
      var data = Singleton.get(OnePage).getSaveData();
      data.push({
        name: 'controller',
        value: 'onepage',
      });
      return data;
    };

    PaymentMethodIWD.prototype.savePayment = function() {
      // Add the `required-entry` class back to the fields to ensure they are present
      if ($ji('#payment_form_' + this.code + ' .required-entry').length === 0) {
        $ji('#payment_form_' + this.code + ' .input-text').addClass(
          'required-entry'
        );
      }

      // Use stored card checked, get existing token data
      if (this.transitUseStoredCard()) {
        var radio = $$(
          '[name="hps_transit_stored_card_select"]:checked'
        )[0];
        $('hps_transit_use_stored_card').value = "1";
        var storedcardId = radio.value;
        var storedcardType = $(radio.id + '_card_type').value;
        new Ajax.Request(PaymentMethod.prototype.transitGetTokenDataUrl, {
          method: 'post',
          parameters: {storedcard_id: storedcardId},
          onSuccess: function(response) {
            var data = response.responseJSON;
            if (data && data.token) {
              $('hps_transit_cc_exp_month').value = parseInt(
                data.token.cc_exp_month
              );
              $('hps_transit_cc_exp_year').value = data.token.cc_exp_year;
            }
            this.transitResponseHandler.call(this, {
              card_type: storedcardType,
              token_value: data.token.token_value,
              token_type: null, // 'supt'?
              token_expire: new Date().toISOString(),
              card: {
                number: data.token.cc_last4,
              },
            });
          }.bind(this),
          onFailure: function() {
            alert('Unknown error. Please try again.');
          },
        });
      } else {
        // Use stored card not checked, get new token
        TransITMagento.triggerSubmit();
      }
    };

    PaymentMethodIWD.prototype.transitUseStoredCard = function() {
      var newRadio = $('hps_transit_stored_card_select_new');
      return !newRadio.checked;
    };

    PaymentMethodIWD.prototype.transitResponseHandler = function(
      response
    ) {
      var tokenField = $('hps_transit_token'),
        typeField = $('hps_transit_cc_type'),
        lastFourField = $('hps_transit_cc_last_four');
      tokenField.value = typeField.value = lastFourField.value = null;

      if (
        $('hps_transit_exp_date') &&
        $('hps_transit_exp_date').value
      ) {
        var date = $('hps_transit_exp_date').value.split('/');
        $('hps_transit_cc_exp_month').value = date[0].trim();
        $('hps_transit_cc_exp_year').value = date[1].trim();
      }

      if (TransITMagento.skipCreditCard) {
        TransITMagento.completeCheckout();
        return;
      }

      if (response && response.error) {
        if (response.reasons && response.reasons.length > 0) {
          alert(response.reasons[0].message);
          $ji('.iwd_opc_loader_wrapper.active').hide();
        }
      } else if (response && response.token_value) {
        tokenField.value = response.token_value;
        lastFourField.value = response.card.number.substr(-4);
        typeField.value = response.card_type;

        var data = this.getSaveData();
        $ji('.iwd_opc_loader_wrapper.active').show();
        this.ajaxCall(this.saveUrl, data, this.onSaveOrderSuccess);
      } else {
        alert('Unexpected error.');
      }
    };
  }

  // FireCheckout
  if (typeof window.FireCheckout !== 'undefined') {
    Object.extend(FireCheckout.prototype, {
      save: function (urlSuffix, forceSave) {
        if (this.loadWaiting != false) {
          return;
        }

        if (!this.validate()) {
          return;
        }

        if (payment.currentMethod) {
          // HPS heartland
          if (!forceSave && payment.currentMethod.indexOf("hps_transit") === 0) {
            payment.save();
            return;
          }
          // HPS heartland
        }

        checkout.setLoadWaiting(true);
        var params = Form.serialize(this.form, true);
        $('review-please-wait').show();

        urlSuffix = urlSuffix || '';
        new Ajax.Request(this.urls.save + urlSuffix, {
          method: 'post',
          parameters: params,
          onSuccess: this.setResponse.bind(this),
          onFailure: this.ajaxFailure.bind(this)
        });
      },
    });
  }
  // FireCheckout
});
