import React, { useState, useEffect } from "react";
import ReactFlow, { MiniMap, Controls } from "react-flow-renderer";

const orgData = {
  name: "testcustomer",
  uuid: "15566d05-2741-4679-8892-ae00c911c699",
  vdcs: [
    {
      name: "com-a-testcustomer-02",
      href: "https://vcloud-ffm-private.t-systems.de/api/admin/vdc/efdf41a4-c297-48c6-9e84-d9bd4658ded4",
      urn: "urn:vcloud:vdc:efdf41a4-c297-48c6-9e84-d9bd4658ded4",
      vapps: [
        {
          name: "TASTE-OS Test",
          href: "https://vcloud-ffm-private.t-systems.de/api/vApp/vapp-bb42bff9-f4fb-4683-bd08-e79b97533c65",
          details: {
            vAppName: "TASTE-OS Test",
            VirtualMachines: [
              {
                name: "VM1",
                id: "urn:vcloud:vm:c647c09f-c382-4c78-80be-d9a5da327f57",
                details: { RAM: 4096, numCpu: 1 },
                networks: [
                  {
                    networkName: "Routed Network",
                    ipAddress: "10.0.0.5",
                    MAC: "00:50:56:06:a7:29",
                    adapter: "VMXNET3",
                    isConnected: true,
                  },
                  {
                    networkName: "test",
                    ipAddress: "111.111.111.10",
                    MAC: "00:50:56:06:a3:e5",
                    adapter: "VMXNET3",
                    isConnected: true,
                  },
                ],
              },
            ],
          },
        },
        {
          name: "mig-tool",
          href: "https://vcloud-ffm-private.t-systems.de/api/vApp/vapp-9e0996c9-0e6f-46d2-a13c-e9ff12c4cd20",
          details: {
            vAppName: "mig-tool",
            VirtualMachines: [
              {
                name: "mig-tool-test",
                id: "urn:vcloud:vm:8adff57f-8a2a-4416-a954-360a75efb0c0",
                details: { RAM: 4096, numCpu: 1 },
                networks: [
                  {
                    networkName: "test",
                    ipAddress: "111.111.111.10",
                    MAC: "00:50:56:06:a3:e5",
                    adapter: "VMXNET3",
                    isConnected: true,
                  },
                ],
              },
            ],
          },
        },
      ],
    },
    {
      name: "bas-a-testcustomer-01",
      href: "https://vcloud-ffm-private.t-systems.de/api/admin/vdc/266ec39b-e79e-4011-81ab-e198e71135f2",
      urn: "urn:vcloud:vdc:266ec39b-e79e-4011-81ab-e198e71135f2",
      vapps: [
        {
          name: "ssafrank_test22-d8cb3753-2f7c-4730-96f5-2bda9c842594",
          href: "https://vcloud-ffm-private.t-systems.de/api/vApp/vapp-57cd3823-f8cd-48b7-9d6e-37d75c3a9022",
          details: {
            vAppName: "ssafrank_test22-d8cb3753-2f7c-4730-96f5-2bda9c842594",
            VirtualMachines: [
              {
                name: "ssafrank_test22",
                id: "urn:vcloud:vm:67e2a721-9457-4a01-b570-fcce27bb5bb7",
                details: { RAM: 7680, numCpu: 2 },
                networks: [
                  {
                    networkName: "none",
                    ipAddress: null,
                    MAC: "00:50:56:06:a7:22",
                    adapter: "VMXNET3",
                    isConnected: false,
                  },
                  {
                    networkName: "test",
                    ipAddress: "111.111.111.10",
                    MAC: "00:50:56:06:a3:e5",
                    adapter: "VMXNET3",
                    isConnected: true,
                  },
                ],
              },
            ],
          },
        },
        {
          name: "ssafrank_test22-d8cb3753-2f7c-4730-96f5-2bda9c842594",
          href: "https://vcloud-ffm-private.t-systems.de/api/vApp/vapp-57cd3823-f8cd-48b7-9d6e-37d75c3a9022",
          details: {
            vAppName: "ssafrank_test22-d8cb3753-2f7c-4730-96f5-2bda9c842594",
            VirtualMachines: [
              {
                name: "ssafrank_test22",
                id: "urn:vcloud:vm:67e2a721-9457-4a01-b570-fcce27bb5bb7",
                details: { RAM: 7680, numCpu: 2 },
                networks: [
                  {
                    networkName: "none",
                    ipAddress: null,
                    MAC: "00:50:56:06:a7:22",
                    adapter: "VMXNET3",
                    isConnected: false,
                  },
                  {
                    networkName: "test",
                    ipAddress: "111.111.111.10",
                    MAC: "00:50:56:06:a3:e5",
                    adapter: "VMXNET3",
                    isConnected: true,
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  ],
};
const CustomNodeFlow = () => {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    const nodes = [];
    const edges = [];
    const networkMap = new Map();
    let yOffset = 0;

    // Organization node
    nodes.push({
      id: "org-1",
      data: { label: orgData.name },
      position: { x: 250, y: yOffset },
      style: { border: "1px solid #777", padding: 10 },
      sourcePosition: "bottom",
    });
    yOffset += 150;

    // VDC nodes
    orgData.vdcs.forEach((vdc, vdcIndex) => {
      const vdcId = `vdc-${vdcIndex + 1}`;
      nodes.push({
        id: vdcId,
        data: { label: vdc.name },
        position: { x: 650 * vdcIndex, y: yOffset },
        style: { border: "1px solid #777", padding: 10 },
        targetPosition: "top",
        sourcePosition: "bottom",
      });
      edges.push({
        id: `e-org-vdc-${vdcId}`,
        source: "org-1",
        target: vdcId,
        animated: true,
      });

      // vApp nodes within VDC
      vdc.vapps.forEach((vapp, vappIndex) => {
        const vappId = `vapp-${vdcIndex}-${vappIndex}`;
        nodes.push({
          id: vappId,
          data: { label: vapp.name },
          position: { x: 550 * vdcIndex + 250 * vappIndex, y: yOffset + 150 },
          style: { border: "1px solid #777", padding: 10 },
          targetPosition: "top",
          sourcePosition: "bottom",
        });
        edges.push({
          id: `e-vdc-vapp-${vappId}`,
          source: vdcId,
          target: vappId,
          animated: true,
        });

        // VM nodes within vApp
        vapp.details.VirtualMachines.forEach((vm, vmIndex) => {
          const vmId = `vm-${vdcIndex}-${vappIndex}-${vmIndex}`;
          nodes.push({
            id: vmId,
            data: { label: vm.name },
            position: {
              x: 550 * vdcIndex + 250 * vappIndex + 50,
              y: yOffset + 300 + 100 * vmIndex,
            },
            style: { border: "1px solid #777", padding: 10 },
            targetPosition: "top",
            sourcePosition: "bottom",
          });
          edges.push({
            id: `e-vapp-vm-${vmId}`,
            source: vappId,
            target: vmId,
            animated: true,
          });

          // Network nodes within VM, ensuring unique networks
          vm.networks.forEach((network) => {
            const networkKey = `${network.networkName}`;
            let networkId;

            if (!networkMap.has(networkKey)) {
              networkId = `network-${networkKey}`;
              nodes.push({
                id: networkId,
                data: {
                  label: `${network.networkName} (${
                    network.ipAddress || "N/A"
                  })`,
                },
                position: {
                  x: 450 * vdcIndex + 100 * vappIndex + 150,
                  y: yOffset + 450 + 100 * vmIndex,
                },
                style: { border: "1px solid #777", padding: 10 },
                targetPosition: "top",
              });
              networkMap.set(networkKey, networkId);
            } else {
              networkId = networkMap.get(networkKey);
            }

            edges.push({
              id: `e-vm-network-${networkId}`,
              source: vmId,
              target: networkId,
              animated: true,
            });
          });
        });
      });
    });

    setElements([...nodes, ...edges]);
  }, []);

  return (
    <ReactFlow elements={elements} style={{ width: "100%", height: "100vh" }}>
      <MiniMap />
      <Controls />
    </ReactFlow>
  );
};

export default CustomNodeFlow;


##odvodena z vdc value 

import React, { useState, useEffect } from "react";
import ReactFlow, { MiniMap, Controls } from "react-flow-renderer";

const orgData = {
  name: "testcustomer",
  uuid: "15566d05-2741-4679-8892-ae00c911c699",
  vdcs: [
    {
      name: "com-a-testcustomer-02",
      href: "https://vcloud-ffm-private.t-systems.de/api/admin/vdc/efdf41a4-c297-48c6-9e84-d9bd4658ded4",
      urn: "urn:vcloud:vdc:efdf41a4-c297-48c6-9e84-d9bd4658ded4",
      vapps: [
        {
          name: "TASTE-OS Test",
          href: "https://vcloud-ffm-private.t-systems.de/api/vApp/vapp-bb42bff9-f4fb-4683-bd08-e79b97533c65",
          details: {
            vAppName: "TASTE-OS Test",
            VirtualMachines: [
              {
                name: "VM1",
                id: "urn:vcloud:vm:c647c09f-c382-4c78-80be-d9a5da327f57",
                details: { RAM: 4096, numCpu: 1 },
                networks: [
                  {
                    networkName: "Routed Network",
                    ipAddress: "10.0.0.5",
                    MAC: "00:50:56:06:a7:29",
                    adapter: "VMXNET3",
                    isConnected: true,
                  },
                  {
                    networkName: "test",
                    ipAddress: "111.111.111.10",
                    MAC: "00:50:56:06:a3:e5",
                    adapter: "VMXNET3",
                    isConnected: true,
                  },
                ],
              },
            ],
          },
        },
        {
          name: "mig-tool",
          href: "https://vcloud-ffm-private.t-systems.de/api/vApp/vapp-9e0996c9-0e6f-46d2-a13c-e9ff12c4cd20",
          details: {
            vAppName: "mig-tool",
            VirtualMachines: [
              {
                name: "mig-tool-test",
                id: "urn:vcloud:vm:8adff57f-8a2a-4416-a954-360a75efb0c0",
                details: { RAM: 4096, numCpu: 1 },
                networks: [
                  {
                    networkName: "test",
                    ipAddress: "111.111.111.10",
                    MAC: "00:50:56:06:a3:e5",
                    adapter: "VMXNET3",
                    isConnected: true,
                  },
                ],
              },
            ],
          },
        },
      ],
    },
    {
      name: "bas-a-testcustomer-01",
      href: "https://vcloud-ffm-private.t-systems.de/api/admin/vdc/266ec39b-e79e-4011-81ab-e198e71135f2",
      urn: "urn:vcloud:vdc:266ec39b-e79e-4011-81ab-e198e71135f2",
      vapps: [
        {
          name: "ssafrank_test22-d8cb3753-2f7c-4730-96f5-2bda9c842594",
          href: "https://vcloud-ffm-private.t-systems.de/api/vApp/vapp-57cd3823-f8cd-48b7-9d6e-37d75c3a9022",
          details: {
            vAppName: "ssafrank_test22-d8cb3753-2f7c-4730-96f5-2bda9c842594",
            VirtualMachines: [
              {
                name: "ssafrank_test22",
                id: "urn:vcloud:vm:67e2a721-9457-4a01-b570-fcce27bb5bb7",
                details: { RAM: 7680, numCpu: 2 },
                networks: [
                  {
                    networkName: "none",
                    ipAddress: null,
                    MAC: "00:50:56:06:a7:22",
                    adapter: "VMXNET3",
                    isConnected: false,
                  },
                  {
                    networkName: "test",
                    ipAddress: "111.111.111.10",
                    MAC: "00:50:56:06:a3:e5",
                    adapter: "VMXNET3",
                    isConnected: true,
                  },
                ],
              },
            ],
          },
        },
        {
          name: "ssafrank_test22-d8cb3753-2f7c-4730-96f5-2bda9c842594",
          href: "https://vcloud-ffm-private.t-systems.de/api/vApp/vapp-57cd3823-f8cd-48b7-9d6e-37d75c3a9022",
          details: {
            vAppName: "ssafrank_test22-d8cb3753-2f7c-4730-96f5-2bda9c842594",
            VirtualMachines: [
              {
                name: "ssafrank_test22",
                id: "urn:vcloud:vm:67e2a721-9457-4a01-b570-fcce27bb5bb7",
                details: { RAM: 7680, numCpu: 2 },
                networks: [
                  {
                    networkName: "none",
                    ipAddress: null,
                    MAC: "00:50:56:06:a7:22",
                    adapter: "VMXNET3",
                    isConnected: false,
                  },
                  {
                    networkName: "test",
                    ipAddress: "111.111.111.10",
                    MAC: "00:50:56:06:a3:e5",
                    adapter: "VMXNET3",
                    isConnected: true,
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  ],
};

const CustomNodeFlow = () => {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    const nodes = [];
    const edges = [];
    const networkMap = new Map();

    // Organization node
    nodes.push({
      id: "org-1",
      data: { label: orgData.name },
      position: { x: 250, y: 50 },
      style: { border: "1px solid #777", padding: 10 },
      sourcePosition: "bottom",
    });

    // VDC nodes with static x, and y based on VDC index
    orgData.vdcs.forEach((vdc, vdcIndex) => {
      const vdcId = `vdc-${vdcIndex + 1}`;
      const vdcX = 300 * vdcIndex; // Static x position for each VDC
      const vdcY = 150; // Base y position for each VDC

      nodes.push({
        id: vdcId,
        data: { label: vdc.name },
        position: { x: vdcX, y: vdcY },
        style: { border: "1px solid #777", padding: 10 },
        targetPosition: "top",
        sourcePosition: "bottom",
      });
      edges.push({
        id: `e-org-vdc-${vdcId}`,
        source: "org-1",
        target: vdcId,
        animated: true,
      });

      // vApp nodes positioned relative to VDC
      vdc.vapps.forEach((vapp, vappIndex) => {
        const vappId = `vapp-${vdcIndex}-${vappIndex}`;
        const vappX = vdcX - 100 + vappIndex * 150; // x position relative to VDC
        const vappY = vdcY + 150; // y offset from VDC

        nodes.push({
          id: vappId,
          data: { label: vapp.name },
          position: { x: vappX, y: vappY },
          style: { border: "1px solid #777", padding: 10 },
          targetPosition: "top",
          sourcePosition: "bottom",
        });
        edges.push({
          id: `e-vdc-vapp-${vappId}`,
          source: vdcId,
          target: vappId,
          animated: true,
        });

        // VM nodes positioned relative to vApp
        vapp.details.VirtualMachines.forEach((vm, vmIndex) => {
          const vmId = `vm-${vdcIndex}-${vappIndex}-${vmIndex}`;
          const vmX = vappX + vmIndex * 100; // x position relative to vApp
          const vmY = vappY + 150; // y offset from vApp

          nodes.push({
            id: vmId,
            data: { label: vm.name },
            position: { x: vmX, y: vmY },
            style: { border: "1px solid #777", padding: 10 },
            targetPosition: "top",
            sourcePosition: "bottom",
          });
          edges.push({
            id: `e-vapp-vm-${vmId}`,
            source: vappId,
            target: vmId,
            animated: true,
          });

          // Network nodes positioned relative to VM, ensuring unique networks
          vm.networks.forEach((network) => {
            const networkKey = `${network.networkName}`;
            let networkId;

            if (!networkMap.has(networkKey)) {
              networkId = `network-${networkKey}`;
              nodes.push({
                id: networkId,
                data: {
                  label: `${network.networkName} (${
                    network.ipAddress || "N/A"
                  })`,
                },
                position: { x: vmX + 150, y: vmY + 100 }, // relative to VM
                style: { border: "1px solid #777", padding: 10 },
                targetPosition: "top",
              });
              networkMap.set(networkKey, networkId);
            } else {
              networkId = networkMap.get(networkKey);
            }

            edges.push({
              id: `e-vm-network-${networkId}`,
              source: vmId,
              target: networkId,
              animated: true,
            });
          });
        });
      });
    });

    setElements([...nodes, ...edges]);
  }, []);

  return (
    <ReactFlow elements={elements} style={{ width: "100%", height: "100vh" }}>
      <MiniMap />
      <Controls />
    </ReactFlow>
  );
};

export default CustomNodeFlow;


https://codesandbox.io/p/sandbox/naughty-cherry-4dv5d8?file=%2Fsrc%2FApp.js%3A1%2C1-264%2C1