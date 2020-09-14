if (typeof AdminOrder.prototype._secureSubmitOldSubmit === 'undefined') {
    var oldAdminOrder = Object.clone(AdminOrder.prototype);
    AdminOrder.prototype._secureSubmitOldSubmit = oldAdminOrder.submit;
}
Object.extend(AdminOrder.prototype, {
    submit: function() {
        if (this.paymentMethod != 'hps_transit') {
            this._secureSubmitOldSubmit();
            return;
        }
        // Use stored card checked, get existing token data                                                                                                                                                                                 
        if (this.secureSubmitUseStoredCard()) {
            var storedcardId = $('hps_transit_stored_card_select').value;
            var customerId = $('hps_transit_customer_id').value;
            // Set credit card information
            var creditCardId = $('hps_transit_stored_card_select').value;
            if (order.customerStoredCards[creditCardId]) {
                var creditCardData = order.customerStoredCards[creditCardId];
                $('hps_transit_expiration').value = parseInt(creditCardData.cc_exp_month);
                $('hps_transit_expiration_yr').value = creditCardData.cc_exp_year;
                $('hps_transit_token').value = creditCardData.token_value;
                $('hps_transit_cc_last_four').value = creditCardData.cc_last_four;
                this.secureSubmitResponseHandler({
                    token_value:  creditCardData.token_value,
                    token_type:   null, // 'supt'?                                                                                                                                                                                      
                    token_expire: new Date().toISOString(),
                    card: {
                        number: creditCardData.cc_last_four
                    }
                });
            }
        }
        // Use stored card not checked, get new token                                                                                                                                                                                       
        else{
            hps.tokenize({
                data: {
                    public_key: this.secureSubmitPublicKey,
                    number: $('hps_transit_cc_number').value,
                    cvc: $('hps_transit_cc_cid').value,
                    exp_month: $('hps_transit_expiration').value,
                    exp_year: $('hps_transit_expiration_yr').value
                },
                success: this.secureSubmitResponseHandler.bind(this),
                error: this.secureSubmitResponseHandler.bind(this)
            });
        }
    },
    secureSubmitUseStoredCard: function () {
        var storedCheckbox = $('hps_transit_stored_card_checkbox');
        return storedCheckbox && storedCheckbox.checked;
    },
    secureSubmitResponseHandler: function (response) {
        var tokenField = $('hps_transit_token'),
            lastFourField = $('hps_transit_cc_last_four');
        tokenField.value = lastFourField.value = null;

        if (response && response.error) {
            if (response.message) {
                alert(response.message);
            }
            //checkout.setLoadWaiting(false);
        } else if (response && response.token_value) {
            tokenField.value = response.token_value;
            lastFourField.value = response.card.number.substr(-4);

            if (this.orderItemChanged) {
                if (confirm('You have item changes')) {
                    if (editForm.submit()) {
                        disableElements('save');
                    }
                } else {
                    this.itemsUpdate();
                }
            } else {
                if(this.secureSubmitUseStoredCard()){
                    if (editForm._submit()) {
                        disableElements('save');
                    }
                }else{
                    if (editForm.submit()) {
                        disableElements('save');
                    }
                }
            }
        } else {
            alert('Unexpected error.')
        }
    }
});
