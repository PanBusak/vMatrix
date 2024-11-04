const { fetchOrganizations } = require('./apiCalls/fetchOrganization');
const { fetchVdcs } = require('./apiCalls/fetchVdcs');
const { fetchVdcDetails } = require('./apiCalls/fetchVdcDetails');
const {fetchVappDetails} = require('./apiCalls/fetchVappDetails')
const {fetchAllOrgVdcNetworks} = require('./apiCalls/fetchAllOrgVdcNetworks')
const {fetchAllExternalnetworks} = require('./apiCalls/fetchAllExternalNetworks')
const {fetchAllEdgeGateways} = require('./apiCalls/fetchAllEdgeGateways')
const {fetchVmDetails} = require('./apiCalls/fetchVmsDetails')
async function startProcess() {
  try {
   //const orgsDetails = await fetchOrganizations();    // Step 1: Fetch organizations
    const orgDetailForTesting = [{name:"T-Systems Nordic A/S, sivuliike Suomessa(1889)_1000041086",uuid:"b60f8a33-74aa-4b09-ba3b-e7013f286bf4"},
      { name: 'testorg', uuid: '41fc155c-fe42-4d3b-b0a9-031592d98220' }]
    //console.log(orgsDetails.find(org => org.name === 'testcustomer'))
    
    const orgsWithVdc = await fetchVdcs(orgDetailForTesting)  
   
    const vdcWithVapp = await fetchVdcDetails(orgsWithVdc) 
         
    const vappWithVm = await fetchVappDetails(vdcWithVapp)

    await fetchVmDetails(vappWithVm)
    console.log('Process completed successfully!');
  } catch (error) {
    console.error('Error during the process:', error.message);
  }
}


async function startProcessNetworks() {
  try {
    const gateways = await fetchAllEdgeGateways()
    const orgVdcNetworks = await fetchAllOrgVdcNetworks(gateways)
    
    console.log('Process networks completed successfully!');
  } catch (error) {
    console.error('Error during the process:', error.message);
  }
}

//startProcessNetworks();
startProcess()

