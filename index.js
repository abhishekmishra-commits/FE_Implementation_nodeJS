const express = require('express');
const path = require('path');
const initializeVwo = require('./vwo');

const app = express();
const port = 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));


  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  });

  // Logout route - redirects to login page
  app.get('/logout', (req, res) => {
    console.log('User logged out');
    res.redirect('/');
  });

// ... continue with your async VWO init and /login route
let vwoClient;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

(async () => {
  vwoClient = await initializeVwo();


  app.post('/login', async (req, res) => {
    const username = req.body.username;
    const location = req.body.region || 'Unknown';
    console.log('Form submitted. Username:', username, 'Country:', location); //Setting user context for unique users within VWO
    const userContext = {
      id: username,
      customVariables: { age: 25, Country_Location: location, VWOSession: true},
      userAgent: req.headers['user-agent'],
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    };
    
    // Set username attribute in VWO
    const attributes = { 'username': username };
    vwoClient.setAttribute(attributes, userContext);
    console.log(`Username attribute set in VWO for user: ${username}`);

    // To check the feature flag and check it is enabled.
    const flag = await vwoClient.getFlag('fmeDemo', userContext);
    console.log("flag Settings:", flag);
    const isFlagEnabled = flag.isEnabled();
    //console.log("custom log flag value:", flag);
    //const flagStatus = flag.getValue();

    // Get value of the flag's variable
    const variableValue = flag.getVariable('Price', 110.99);
    const ShoePricing = flag.getVariable('ShoePricing', 90.00);
    const WatchPricing = flag.getVariable('WatchPricing', 75.82);
    //variableValue=0
    //console.log("Price Variable:", variableValue)
    //vwoClient.trackEvent('offlineconversion',userContext);
    //vwoClient.setAttribute('user-type', 'beta', userContext);

    // Set a custom user attribute in VWO for the specified user context.
// 'attribute_key' is the name of the attribute (e.g., 'subscription_status').
// 'attribute_value' is the value to assign to the attribute (e.g., 'premium').
  //const attributeMap = {attributeKey: 'attributeValue'};
  //vwoClient.setAttribute(attributeMap);

   allVariables = flag.getVariables();
   console.log("All variable:",allVariables);

    res.render('product', {
        allVariables,
        variableValue,
        ShoePricing,
        WatchPricing,
        username: username,
        location: location
      });
  });

  // Endpoint to track add to cart events
  app.post('/track-event', async (req, res) => {
    try {
      const { username, productName, price, location } = req.body;
      
      if (!username || !productName || !price) {
        return res.status(400).json({ error: 'Missing required fields: username, productName, price' });
      }

      // Reconstruct user context
      const userContext = {
        id: username,
        customVariables: { age: 25, VWOSession: true, location: location || 'Unknown' },
        userAgent: req.headers['user-agent'],
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      };

      // Event properties for the add to cart event
      const eventProperties = {
        productName: productName,
        price: parseFloat(price),
        timestamp: new Date().toISOString()
      };

      // Track the event in VWO
      await vwoClient.trackEvent('addToCart', userContext, eventProperties);
      
      console.log(`Event tracked: addToCart for user ${username}, product: ${productName}, price: ${price}`);
      
      res.json({ success: true, message: 'Event tracked successfully' });
    } catch (error) {
      console.error('Error tracking event:', error);
      res.status(500).json({ error: 'Failed to track event', details: error.message });
    }
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
})();