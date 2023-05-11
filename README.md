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

### Instana Agent Configuration
Go to your Instana installation (Instana User Interface), click ... More > Agents > Installing Instana Agents and select 'Kubernetes' platform to get the Instana Agent Key, Instana Service Endpoint, Instana Service port. These steps are also described [here](https://www.ibm.com/docs/en/instana-observability/218?topic=instana-endpoints-keys) or in the screenshot below.

![Instana Agent Configuration](/docs/instana-agent.png)

## How to use IBM Instana Addon for Amazon EKS Blueprint
Refer the AWS CDK EKS-Blueprint starter guide to create a new project and installing dependecies https://aws-quickstart.github.io/cdk-eks-blueprints/getting-started/ 

Once the project is created, install instana-eks-blueprint-addon npm package using following command.

```shell
npm i instana-eks-blueprint-addon
```

Go back to the ```bin/<your-main-file>.ts``` and and refer below code as reference for providing configuration values to Instana Addon.

```typescript
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { InstanaOperatorAddon } from 'instana-eks-blueprint-addon';
const app = new cdk.App();
const account = '<AWS_ACCOUNT>';
const region = '<AWS_REGION>';

export const defaultProps = {
  zone: '<AWS_REGION>',
  cluster_name: '<AMAZON_EKS_CLUSTER_NAME>',
  instana_agent_key: '<INSTANA_AGENT_KEY>',
  endpoint_host: '<INSTANA_ENDPOINT_HOST_URL>',
  endpoint_port: '<INSTANA_ENDPOINT_HOST_PORT>',
  instana_agent_env_tag_name: '<INSTANA_AGENT_ENV_TAG>' #dev, staging, prod etc.
}

const addOns: Array<blueprints.ClusterAddOn> = [
  new InstanaOperatorAddon(defaultProps)
];

const stack = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .addOns(...addOns)
    .useDefaultSecretEncryption(true) // set to false to turn secret encryption off (non-production/demo cases)
    .build(app, '<AMAZON_EKS_CLUSTER_NAME>');
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

