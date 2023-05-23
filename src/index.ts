/**
 * Instana Addon for Amazon EKS Blueprint
 * 
 * Description: This file contains the implementation of the Instana Addon for Amazon EKS Blueprint.
 * The Instana Addon integrates the Instana sensor with Amazon Elastic Kubernetes Service (EKS).
 * It enables monitoring and troubleshooting of EKS clusters and applications running on them using Instana's powerful features.
 * 
 * @author "Arpit Nanavati <Arpit.Nanavati@ibm.com>"
 * @version 1.0.0
 * 
 * Copyright (c) [2023], [IBM Corp.]
 * All rights reserved.
 * 
 */

import {
  ClusterAddOn,
  ClusterInfo,
} from "@aws-quickstart/eks-blueprints/dist/spi";
import {
  loadExternalYaml
} from "@aws-quickstart/eks-blueprints/dist/utils/yaml-utils";
import {
  ICluster,
  KubernetesManifest
} from "aws-cdk-lib/aws-eks";


export class InstanaOperatorAddon implements ClusterAddOn {
  private _instanaProps: any;
  public get instanaProps(): any {
    return this._instanaProps;
  }
  public set instanaProps(value: any) {
    this._instanaProps = value;
  }
  constructor(yamlObject: any) {
    this._instanaProps = yamlObject;
  }

  deploy(clusterInfo: ClusterInfo): void {
    const cluster = clusterInfo.cluster;
    const eksCluster: ICluster = {
      clusterName: cluster.clusterName,
      kubectlRole: cluster.kubectlRole,
      vpc: cluster.vpc,
      clusterArn: cluster.clusterArn,
      clusterEndpoint: cluster.clusterEndpoint,
      clusterCertificateAuthorityData: cluster.clusterCertificateAuthorityData,
      clusterSecurityGroupId: cluster.clusterSecurityGroupId,
      clusterSecurityGroup: cluster.clusterSecurityGroup,
      clusterEncryptionConfigKeyArn: cluster.clusterEncryptionConfigKeyArn,
      openIdConnectProvider: cluster.openIdConnectProvider,
      prune: cluster.prune,
      addServiceAccount: cluster.addServiceAccount,
      addManifest: cluster.addManifest,
      addHelmChart: cluster.addHelmChart,
      addCdk8sChart: cluster.addCdk8sChart,
      connectAutoScalingGroupCapacity: cluster.connectAutoScalingGroupCapacity,
      stack: cluster.stack,
      env: cluster.env,
      applyRemovalPolicy: cluster.applyRemovalPolicy,
      node: cluster.node,
      connections: cluster.connections,
    };

    let manifest = null;
    const instanaCustomResourceObj = {
      apiVersion: 'instana.io/v1',
      kind: 'InstanaAgent',
      metadata: {
        name: 'instana-agent',
        namespace: 'instana-agent'
      },
      spec: {
      }
    };

    // Validate if key, host, port are not empty, null, or undefined.
    initValidation(this._instanaProps);

    //Add instanaProps in the spec
    instanaCustomResourceObj.spec = this._instanaProps;

    manifest = [instanaCustomResourceObj];

    console.log("############################################################");
    console.log(instanaCustomResourceObj.spec);
    console.log("############################################################");

    const km1 = new KubernetesManifest(
      cluster.stack,
      "instana_v1_instanaagent",
      {
        cluster: eksCluster,
        manifest,
        overwrite: true,
        skipValidation: true,
      }
    );


    manifest = loadExternalYaml(
      "https://github.com/instana/instana-agent-operator/releases/latest/download/instana-agent-operator.yaml"
    ).slice(0, 9);
    console.log("############################################################");
    console.log(manifest);
    console.log("############################################################");
    const km2 = new KubernetesManifest(
      cluster.stack,
      "Instana_Operator_Manifest",
      {
        cluster: eksCluster,
        manifest,
        overwrite: true,
        skipValidation: true,
      }
    );

    km1.node.addDependency(km2);

    function initValidation(instanaProps: any) {

      if (instanaProps.cluster == undefined || instanaProps.zone == undefined || instanaProps.agent == undefined) {
        throwErrorAndExit('cluster, zone, or agent cannot be blank');
      }

      if (instanaProps.cluster.name == undefined || instanaProps.cluster.name == null || instanaProps.cluster.name == '') {
        throwErrorAndExit('cluster name cannot be undefined, null or empty');
      }

      if (instanaProps.zone.name == undefined || instanaProps.zone.name == null || instanaProps.zone.name == '') {
        throwErrorAndExit('zone name cannot be undefined, null or empty');
      }

      if (instanaProps.agent.key == undefined || instanaProps.agent.key == null || instanaProps.agent.key == '') {
        throwErrorAndExit('agent key cannot be undefined, null or empty');
      }

      if (instanaProps.agent.endpointHost == undefined || instanaProps.agent.endpointHost == null || instanaProps.agent.endpointHost == '') {
        throwErrorAndExit('agent endpointHost cannot be undefined, null or empty');
      }

      if (instanaProps.agent.endpointPort == undefined || instanaProps.agent.endpointPort == null || instanaProps.agent.endpointPort == '') {
        throwErrorAndExit('agent endpointPort cannot be undefined, null or empty');
      }
    }

    function throwErrorAndExit(errorMessage: string): never {
      console.error(errorMessage);
      process.exit(1);
    }
  }
}