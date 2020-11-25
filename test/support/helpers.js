export function getStorefrontUrl() {
  let result = 'http://127.0.0.1:8081';

  if (process && process.env && process.env.STOREFRONT_URL) {
    result = process.env.STOREFRONT_URL;
  }

  return result;
}

export function confirmSuccessfulCheckout() {
  cy.get('body').should('have.class', 'checkout-onepage-success');
}

export function placeOrder() {
  return cy.get('#review-buttons-container button').click();
}

export function enterPaymentInformation(data) {
  if (!data) {
    data = {};
  }

  cy.get('#p_method_hps_transit').click();

  if (data.customerNewCard) {
    cy.get('#hps_transit_stored_card_select_new').check();
  }

  cy.wait(1000);

  cy.get("#hps_transit_cc_number_iframe > iframe").then(enterInIframe(data.number || '4242424242424242'));
  cy.get("#hps_transit_cc_exp_iframe > iframe").then(enterInIframe(data.expDate || '12 / 2025'));
  if (data.cvv !== false) {
    cy.get("#hps_transit_cc_cvv_iframe > iframe").then(enterInIframe(data.cvv || '123'));
  }

  if (data.save) {
    cy.get('#hps_transit_cc_save_future').check();
  }

  cy.get('#payment-buttons-container button').click();
}

export function useASavedCard() {
  cy.get('#p_method_hps_transit').click();
  cy.get('input[name="hps_transit_stored_card_select"]:first').check();
  cy.get('#payment-buttons-container button').click();
}

export function confirmShippingMethod() {
  cy.get('#shipping-method-buttons-container button').click();
}

export function enterBillingInformation(data) {
  if (!data) {
    data = {};
  }

  if (data.isCustomer) {
    cy.get('#billing-address-select').select('New Address');
  }

  typeInputValue('input[id="billing:firstname"]', data.firstName || 'Jane');
  typeInputValue('input[id="billing:lastname"]', data.lastName || 'Smith');
  if (!data.isCustomer) {
    typeInputValue('input[id="billing:email"]', data.email || 'jane@smith.com');
  }
  typeInputValue('input[id="billing:street1"]', data.street1 || '1 Heartland Way');
  typeInputValue('input[id="billing:city"]', data.city || 'Jeffersonville');
  cy.get('select[id="billing:region_id"]').select('Indiana');
  typeInputValue('input[id="billing:postcode"]', data.zip || '47130');
  typeInputValue('input[id="billing:telephone"]', data.telephone || '5555555555');

  cy.get('input[id="billing:use_for_shipping_yes"]').click();
  cy.get('#billing-buttons-container button').click();
}

export function checkoutAsCustomer() {
  typeInputValue('#login-email', 'jane@smith.com');
  typeInputValue('#login-password', 'password');
  cy.get('#checkout-step-login button[type="submit"]').click();
}

export function checkoutAsGuest() {
  cy.get('input[id="login:guest"]').click();
  cy.get('#onepage-guest-register-button').click();
}

export function goToCheckout() {
  cy.get('.btn-checkout:first').click();
}

export function addAProductToCart(productUrlKey) {
  if (!productUrlKey) {
    cy.get('.products-grid .item:first .actions .btn-cart').click();
    return;
  }

  cy.visit(getStorefrontUrl() + '/index.php/' + productUrlKey + '.html');
  cy.get('#product_addtocart_form .btn-cart').click();
}

export function findACategory() {
  cy.get('#nav a:first').click();
}

export function typeInputValue(inputSelector, value) {
  cy.get(inputSelector).type('{selectall}' + value);
}

export function enterInIframe(content, selector) {
  if (!selector) {
    selector = "#secure-payment-field";
  }

  return (frame) => {
    cy
      .wrap(frame.contents().find("body"))
      .find(selector)
      .type(content, { force: true });
  };
}

export function adminLogin() {
  typeInputValue('#username', 'admin');
  typeInputValue('#login', '69fLgKZUefbBMPn');
  cy.get('#loginForm input[type="submit"]').click();
}

export function setPaymentAction(action) {
  // goto system config
  cy.get('#nav > li:last-child > ul > li:last-child a').should('have.text', 'Configuration').click({ force: true });

  cy.get('#system_config_tabs dd:nth-of-type(9) a').click();

  cy.get('#payment_hps_transit_payment_action').select(action);

  cy.get('#content .form-buttons button[title="Save Config"]:first').click();
}
