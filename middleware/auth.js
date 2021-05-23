const {jwtr} = require ('../common/common');
const logger = require ('../libs/loggerLib');
const response = require ('../libs/responseLib');
module.exports = async function (req, res, next) {
  let token = '';
  let apiResponse = '';
  
  if (req.header ('x-auth-token')) {
    token = req.header ('x-auth-token');
  } else {
    token = req.query.token;
  }
  console.log ('here goes token');
  // console.log (req); 
  // console.log (req.params); 
  console.log (token);  

  if (!token)
    return res.status (401).send ('Access denied. No token provided.');

  try {
    const decoded = await jwtr.verify (token, process.env.AUTH_TOKEN_KEY);
    console.log(decoded);
    req.user = decoded;
    next ();
  } catch (ex) {
    console.log (ex);
    apiResponse = response.generate (
      true,
      'Invalid token',
      401,
      {},
      {}
    );
   return res.status (401).send (apiResponse);
  }
};
