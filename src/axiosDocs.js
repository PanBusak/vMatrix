const axios = require('axios');

async function get1() {
    axios
    .get('https://vcloud-ffm-private.t-systems.de/cloudapi/1.0.0/orgs', {
      timeout: 5000,
      proxy: {
        host: '10.36.152.6:3128', // Your proxy host
        port: 3128 // Your proxy port
      }
    })
    .then(res => console.log(res.data))
    .catch(err => console.error(err));
}

get1();