# IBM Instana Addon for Amazon EKS Blueprint

The IBM Instana Addon enables you to install and set up the Instana Host Agent for monitoring your EKS workloads. Once you configure the addon for a Amazon EKS blueprint, it will be automatically provisioned during deployment.

This Addon will use IBM Instana Kubernetes operator in the namespace instana-agent to install and manage the Instana agent. It also configures custom resource values to configure the operator.

## Prerequisites

### AWS CLI
Refer the following guide to install the AWS CLI

```text
https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
```
After installing AWS CLI run following command to configure [AWS CLI](https://docs.aws.amazon.com/cli/latest/reference/configure/)

```shell
aws configure
```

### Node.js and npm
Refer the following guide to install the Node.js and npm

#### Mac
```shell
brew install make
brew install node
```
#### Ubuntu
```shell
sudo apt install make
sudo apt install nodejs
```

### Create Project

```shell
mkdir my-blueprints
cd my-blueprints
sudo npm install -g n
n stable
npm install -g aws-cdk@2.79.0
cdk init app --language typescript
```

### Instana Agent Configuration
Go to your Instana installation (Instana User Interface), click ... More > Agents > Installing Instana Agents and select 'Kubernetes' platform to get the Instana Agent Key, Instana Service Endpoint, Instana Service port. These steps are also described [here](https://www.ibm.com/docs/en/instana-observability/218?topic=instana-endpoints-keys) or in the screenshot below.

![Instana Agent Configuration](/res/instana-agent.png)

## How to use IBM Instana Addon for Amazon EKS Blueprint

Once the project is created, install [eks-blueprints](https://www.npmjs.com/package/@aws-quickstart/eks-blueprints) and [instana-eks-blueprint-addon](https://www.npmjs.com/package/@instana/aws-eks-blueprint-addon) npm package using following command.

```shell
npm i @aws-quickstart/eks-blueprints
```

```shell
npm i @instana/aws-eks-blueprint-addon
```

Go back to the ```bin/<your-main-file>.ts``` and and refer below code as reference for providing configuration values to Instana Addon.

```typescript
import { InstanaOperatorAddon } from '@instana/aws-eks-blueprint-addon';
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { loadYaml } from '@aws-quickstart/eks-blueprints/dist/utils';

const app = new cdk.App();

export const instanaProps = {
  zone: {
    name: "<INSTANA_ZONE_NAME>"// Mandatory Parameter
  },
  cluster: {
    name: "<AMAZON_EKS_CLUSTER_NAME>"// Mandatory Parameter
  },
  agent: {
    key: "<INSTANA_AGENT_KEY>", // Mandatory Parameter
    endpointHost: "<INSTANA_ENDPOINT_HOST_URL>",// Mandatory Parameter
    endpointPort: "<INSTANA_ENDPOINT_HOST_PORT>",// Mandatory Parameter
    env: {
    },
    configuration_yaml:`
    com.instana.plugin.host:
          tags:
            - 'dev'
            - 'app1'
      com.instana.plugin.javatrace:
        instrumentation:
          enabled: true
          opentracing: true
          sdk:
            packages:
              - 'com.instana.backend'
              - 'com.instana.frontend'
    `
  }
};

const yamlObject = loadYaml(JSON.stringify(instanaProps));

// AddOns for the cluster.
const addOns: Array<blueprints.ClusterAddOn> = [
    new InstanaOperatorAddon(yamlObject)
];

const account = '<AWS_ACCOUNT>';
const region = '<AWS_REGION>';

const stack = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .addOns(...addOns)
    .build(app, 'AMAZON_EKS_CLUSTER_NAME');
```
## Bootstraping
Bootstrap your environment with the following command.

```shell
cdk bootstrap
```

and finally you can deploy the stack with the following command.
```shell
cdk deploy
```

#### Output
The output of the above command will be something similar

```console
Outputs:
eks-blueprint.eksblueprintClusterNameF2A3938C = eks-blueprint
eks-blueprint.eksblueprintConfigCommandC5F2ABDA = aws eks update-kubeconfig --name eks-blueprint --region us-east-2 --role-arn arn:aws:iam::<AWS_ACCOUNT>:role/eks-blueprint-eksblueprintMastersRoleDF959839-WGIFJBZQKRNA
eks-blueprint.eksblueprintGetTokenCommandD17B69F1 = aws eks get-token --cluster-name eks-blueprint --region us-east-2 --role-arn arn:aws:iam::<AWS_ACCOUNT>:role/eks-blueprint-eksblueprintMastersRoleDF959839-WGIFJBZQKRNA
```

## Testing
To validate if Instana Agent configured properly in Amazon EKS. You can run the following command after Amazon EKS cluster in deployed and running.
```shell
kubectl get pods -n instana-agent
```

To get the Instana Agent logs run the following command
```shell
kubectl logs <INSTANA_POD_NAME> -n instana-agent
```

Once you see Instana Agent is running in your Amazon EKS Cluster, you can go to Instana Installation (User Interface) to get the APM metrices.

