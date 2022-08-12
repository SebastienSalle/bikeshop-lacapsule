const stripe = require('stripe')(process.env.STRIPE_KEY);
const express = require('express');
const router = express.Router();


const dataBike = [
  {name:"BIK045", url:"/images/bike-1.jpg", price:679},
  {name:"ZOOK07", url:"/images/bike-2.jpg", price:999},
  {name:"TITANS", url:"/images/bike-3.jpg", price:799},
  {name:"CEWO", url:"/images/bike-4.jpg", price:1300},
  {name:"AMIG039", url:"/images/bike-5.jpg", price:479},
  {name:"LIK099", url:"/images/bike-6.jpg", price:869},
];

/* GET home page. */
router.get('/', function(req, res, next) {
  
  let itemsCount = 0;

  if( req.session.dataCardBike === undefined ){
    req.session.dataCardBike = [];
  }else{
    req.session.dataCardBike.map(e => itemsCount += Number(e.quantity))
  }

  res.render('index', {dataBike:dataBike, dataCardBike:req.session.dataCardBike, items:itemsCount});
});

/* GET basket page. */
router.get('/shop', function(req, res, next) {

  if( req.session.dataCardBike === undefined ){
    req.session.dataCardBike = []
  }

  res.render('shop', {dataCardBike:req.session.dataCardBike});
});

/* GET add to basket from home page. */
router.get('/add-shop', function(req, res, next) {

  if( req.session.dataCardBike === undefined ){
    req.session.dataCardBike = []
  }

  let alreadyExist = false;

  for( let i = 0; i < req.session.dataCardBike.length; i++ ){
    if(req.session.dataCardBike[i].name == req.query.bikeNameFromFront){
      req.session.dataCardBike[i].quantity ++;
      alreadyExist = true;
    }
  }

  if( alreadyExist === false && req.query.bikeNameFromFront !== undefined){
    req.session.dataCardBike.push({
      name: req.query.bikeNameFromFront,
      url: req.query.bikeImageFromFront,
      price: req.query.bikePriceFromFront,
      quantity: 1
    })
  }
  
  let itemsCount = 0;

  if(req.session.dataCardBike[0].quantity !== undefined){
    req.session.dataCardBike.map(e => itemsCount += Number(e.quantity))
  }

  res.render('index', {dataBike:dataBike, dataCardBike:req.session.dataCardBike, items:itemsCount});
});

/* GET delete items from basket page. */
router.get('/delete-shop', function(req, res, next){
  
  if( req.session.dataCardBike === undefined ){
    req.session.dataCardBike = []
  }

  req.session.dataCardBike.splice(req.query.position,1)

  res.render('shop',{dataCardBike:req.session.dataCardBike})
})

/* POST change item quantity on basket page. */
router.post('/update-shop', function(req, res, next){
  
  if( req.session.dataCardBike === undefined ){
    req.session.dataCardBike = []
  }

  const position = req.body.position;
  const newQuantity = req.body.quantity;

  req.session.dataCardBike[position].quantity = newQuantity;

  res.render('shop',{dataCardBike:req.session.dataCardBike})
})

/* POST create checkout from basket page. */
router.post('/create-checkout-session', async (req, res) => {
  
  if( req.session.dataCardBike === undefined ){
    req.session.dataCardBike = []
  }

  const stripeItems = [];
  let subTotal = 0;
  let discount = 1;
  
  for(let i = 0 ; i < req.session.dataCardBike.length; i++ ){
    subTotal += req.session.dataCardBike[i].price * req.session.dataCardBike[i].quantity;
  };
  
  if(subTotal > 2000){
    discount = 0.5;
    subTotal *= discount
  };

  //----- Create line for each items in the basket -----
  for(let i = 0 ; i < req.session.dataCardBike.length; i++ ){
    stripeItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: req.session.dataCardBike[i].name,
        },
        unit_amount: req.session.dataCardBike[i].price * 100 * discount,
      },
      quantity: req.session.dataCardBike[i].quantity,
    }); 
  }

  //----- Create a line for postal fees -----
  let fdpAmount = 30;
  let fdpTimes = 0;
  let fdpName = 'frais de port';

  for(let i = 0; i < req.session.dataCardBike.length; i++ ){
    fdpTimes += Number(req.session.dataCardBike[i].quantity)
  };

  if(subTotal > 4000){
    fdpAmount = 0;
    fdpTimes = 1;
    fdpName = 'frais de port offerts'
  };

  stripeItems.push({
    price_data: {
      currency: 'eur',
      product_data: {
        name: fdpName,
      },
      unit_amount: fdpAmount*100,
    },
    quantity: fdpTimes,
  });

  //----- create checkout -----
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: stripeItems,
    mode: 'payment',
    success_url: 'https://bikeshop-from-la-capsule.herokuapp.com/success',
    cancel_url: 'https://bikeshop-from-la-capsule.herokuapp.com/',
  });
  
  res.redirect(303, session.url);
  
})

router.get('/success', (req, res) => {
  
  if( req.session.dataCardBike === undefined ){
    req.session.dataCardBike = []
  }
  
  res.render('success');
});


module.exports = router;