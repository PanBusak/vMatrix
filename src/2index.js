const axios = require('axios');
const fs = require('fs');
const path = require('path');

const accessToken ="eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJsb2NhbC1qYnVkemFrIiwiaXNzIjoiYTkzYzlkYjktNzQ3MS0zMTkyLThkMDktYThmN2VlZGE4NWY5QDc1OTdiZjc5LTE2ZDItNDJkNC04ZGQ1LTg4YzRhMWEzZTU5MCIsInJlZnJlc2hfdG9rZW5faWQiOiI0YzUxYmZhMS1kNTVhLTQ4ZTctYmI0NS1mNzRmY2Y0OWIyZDciLCJleHAiOjE3Mjk3NjMwMDEsInZlcnNpb24iOiJ2Y2xvdWRfMS4wIiwianRpIjoiYjZkNjk0ZTc4ZjI3NGJkMzllMzMwYWE2ZDIwMGY0NjEifQ.a02G0rguI7IgRiQAkfYI8HLwejHQmvJ5AgVEuCMZzDN0HsuaL7lJ1AJYgIT_JUNcncrzngpTPnRAn7mr4E0LEIu0zFWPFgKIjI9zcEb7AQVJ1PPAaoB620iFyQIncL-T7WI0rqiY69l9bCqWC7gqNZbuBrIo72rB0YOVWNWEnEo8sX9iawKDT7Mlj8HNWyJSzHVT6ah1UEGnACQFxv7eVTgMSVoXNEAMKS4XWj6le4_2G1srU8vnAmCv6MuJ189JcFaPqXWU4qBb0chjlZwIg2h759F5H9wSn2O0ZofP414Ev2uKFdkYkxDlwYeYqHH9tkpnZEk-b1uZmqsknXL9Pw"
const orgsDetails = [];

// Function to save results to a file
function saveToFile(data) {
    const outputFilePath = path.join(__dirname, 'orgDetails.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Function to fetch the list of organizations
async function fetchOrganizations() {
  try {
    const response = await axios({
      method: 'get',
      url: "https://vcloud-ffm-private.t-systems.de/cloudapi/1.0.0/orgs",
      headers: {
        'Accept': 'application/json;version=36.0',
        'Authorization': `Bearer ${accessToken}`
      },
    });

    const orgsArray = response.data.values;

    for (const org of orgsArray) {
      const uuid = org.id.split(':').pop();
      orgsDetails.push({
        name: org.name,
        uuid: uuid,
      });
    }

    console.log('Fetched organization details successfully.');
    saveToFile(orgsDetails);

    await fetchOrgDetails();
  } catch (error) {
    console.error('Error fetching organizations:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch organizations.');
  }
}

// Function to fetch details of each organization concurrently
async function fetchOrgDetails() {
  try {
    const orgRequests = orgsDetails.map(org => {
      return axios({
        method: 'get',
        url: `https://vcloud-ffm-private.t-systems.de/api/admin/org/${org.uuid}`,
        headers: {
          'Accept': 'application/*+json;version=36.0',
          'Authorization': `Bearer ${accessToken}`
        },
      });
    });

    const responses = await axios.all(orgRequests);

    responses.forEach((response, index) => {
      const data = response.data;
      const vdcs = data.vdcs.vdc.map(vdc => ({
        name: vdc.name,
        href: vdc.href
      }));

      orgsDetails[index].vdcs = vdcs;
      console.log(`Fetched details for organization: ${orgsDetails[index].name}`);
    });

    saveToFile(orgsDetails);
    await fetchVdcDetails(); // Fetch VDC details for all organizations

  } catch (error) {
    console.error('Error fetching organization details:', error.response ? error.response.data : error.message);
  }
}

// Function to fetch VDC details concurrently for all VDCs
async function fetchVdcDetails() {
  try {
    const vdcRequests = orgsDetails.flatMap(org => 
      org.vdcs.map(vdc => ({
        vdcName: vdc.name,
        orgName: org.name,
        request: axios({
          method: 'get',
          url: vdc.href,
          headers: {
            'Accept': 'application/*+json;version=36.0',
            'Authorization': `Bearer ${accessToken}`
          }
        })
      }))
    );

    const vdcResponses = await axios.all(vdcRequests.map(v => v.request));

    vdcResponses.forEach((response, index) => {
      const vdcData = response.data;
      const vdcInfo = vdcRequests[index];
      
      const org = orgsDetails.find(o => o.name === vdcInfo.orgName);
      if (!org.vdcsDetails) org.vdcsDetails = [];

      org.vdcsDetails.push({
        name: vdcData.name,
        href: vdcData.href,
        additionalInfo: vdcData.resourceEntities
      });

      console.log(`Fetched VDC details for: ${vdcInfo.vdcName} in organization ${vdcInfo.orgName}`);
    });

    saveToFile(orgsDetails);
    await fetchVappDetails(); // Fetch vApp details after VDC details

  } catch (error) {
    console.error('Error fetching VDC details:', error.response ? error.response.data : error.message);
  }
}

// Function to fetch vApp details dynamically from resourceEntities
async function fetchVappDetails() {
  try {
    // Extract vApp URLs from resourceEntities in the VDC details
    const vappRequests = orgsDetails.flatMap(org =>
      org.vdcsDetails.flatMap(vdcDetail => {
        if (vdcDetail.additionalInfo && vdcDetail.additionalInfo.resourceEntity) {
          // Filter vApp resources from resource entities
          return vdcDetail.additionalInfo.resourceEntity
            
            .map(resource => ({
              orgName: org.name,
              vAppHref: resource.href,
              vAppName: resource.name
            }));
        }
        return [];
      })
    );

    // Making requests for each vApp
    const vappResponses = await axios.all(vappRequests.map(vapp => {
      console.log(vapp.vAppHref)
      axios({
        method: 'get',
        url: vapp.vAppHref,
        headers: {
          'Accept': 'application/*+json;version=36.0',
          'Authorization': `Bearer ${accessToken}`
        }
      })
  }));

    // Add vApp details to the organization data
    vappResponses.forEach((response, index) => {
      const vappData = response.data;
      const vappInfo = vappRequests[index];

      const org = orgsDetails.find(o => o.name === vappInfo.orgName);
      if (!org.vapps) org.vapps = [];

      org.vapps.push({
        name: vappData.name,
        href: vappInfo.vAppHref,
        additionalInfo: vappData
      });

      console.log(`Fetched vApp details for: ${vappInfo.vAppName} in organization ${vappInfo.orgName}`);
    });

    saveToFile(orgsDetails); // Save after fetching vApp details

  } catch (error) {
    console.error('Error fetching vApp details:', error.response ? error.response.data : error.message);
  }
}

// Start the process
fetchOrganizations();
