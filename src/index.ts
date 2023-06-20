/**
 * Instana Addon for Amazon EKS Blueprint
 *
 * Description: This file contains the implementation of the Instana Addon for Amazon EKS Blueprints.
 * The Instana Addon integrates the Instana agent with Amazon Elastic Kubernetes Service (EKS).
 * It enables monitoring and troubleshooting of EKS clusters and applications running on them using Instana's powerful features.
 *
 * @author Arpit Nanavati <Arpit.Nanavati@ibm.com>
 * @version 1.0.0
 *
 * Copyright (c) 2023, IBM Corp.
 * All rights reserved.
 */

import { ClusterAddOn, ClusterInfo } from "@aws-quickstart/eks-blueprints/dist/spi";
import { getSecretValue } from "@aws-quickstart/eks-blueprints/dist/utils";
import { loadExternalYaml } from "@aws-quickstart/eks-blueprints/dist/utils/yaml-utils";
import { Construct } from "constructs";

/**
 * InstanaOperatorAddon class represents the Instana Addon for Amazon EKS.
 */
export class InstanaOperatorAddon implements ClusterAddOn {
  private _instanaProps: any;

  constructor(yamlObject: any) {
    this._instanaProps = yamlObject;
  }

  get instanaProps(): any {
    return this._instanaProps;
  }

  set instanaProps(value: any) {
    this._instanaProps = value;
  }

  async deploy(clusterInfo: ClusterInfo): Promise<Construct> {
    const cluster = clusterInfo.cluster;
    const nsManifest: { [key: string]: any } = {
      apiVersion: "instana.io/v1",
      kind: "InstanaAgent",
      metadata: { name: "instana-agent", namespace: "instana-agent" },
      spec: {},
    };

    this.assignDefaultValues(this._instanaProps, clusterInfo);

    if (this._instanaProps.secretParamName) {
      console.log('secret is present', this._instanaProps.secretParamName);
      const instanaSecretParams = await getSecretValue(<string>this._instanaProps.secretParamName, clusterInfo.cluster.stack.region);
      const instanaCreds: InstanaSecret = JSON.parse(instanaSecretParams);
      this._instanaProps.agent = {
        ...this._instanaProps.agent,
        key: instanaCreds.INSTANA_AGENT_KEY,
        endpointHost: instanaCreds.INSTANA_ENDPOINT_HOST_URL,
        endpointPort: instanaCreds.INSTANA_ENDPOINT_HOST_PORT,
      };
      delete this._instanaProps.secretParamName;
    } else {
      console.log('secret not present in the request');
      this.initValidation(this._instanaProps);
    }

    console.info("_instanaProps are", this._instanaProps);

    nsManifest.spec = this._instanaProps;

    console.debug("############################################################");
    console.debug("nsManifest is:", nsManifest);
    console.debug("############################################################");

    const km1 = cluster.addManifest("InstanaObj", nsManifest);

    const manifest: Record<string, unknown>[] = loadExternalYaml(
      "https://github.com/instana/instana-agent-operator/releases/latest/download/instana-agent-operator.yaml"
    );
    console.debug("############################################################");
    console.debug(manifest);
    console.debug("############################################################");

    const km2 = cluster.addManifest("InstanaCRO", ...manifest);

    km1.node.addDependency(km2);

    return km1;
  }

  private assignDefaultValues(instanaProps: any, clusterInfo: ClusterInfo): void {
    instanaProps.zone = instanaProps.zone || {};
    instanaProps.cluster = instanaProps.cluster || {};

    if (!instanaProps.zone.name) {
      instanaProps.zone.name = instanaProps.cluster.name || clusterInfo.cluster.clusterName;
    }

    if (!instanaProps.cluster.name) {
      instanaProps.cluster.name = instanaProps.zone.name || clusterInfo.cluster.clusterName;
    }
  }

  private initValidation(instanaProps: any): void {
    const { agent } = instanaProps;

    if (!agent) {
      this.throwErrorAndExit("cluster, zone, or agent cannot be blank");
    }

    const { key, endpointHost, endpointPort } = agent;

    if (!key || !endpointHost || !endpointPort) {
      this.throwErrorAndExit("Required properties are missing");
    }
  }

  private throwErrorAndExit(errorMessage: string): never {
    throw new Error(errorMessage);
  }
}

interface InstanaSecret {
  INSTANA_AGENT_KEY: string;
  INSTANA_ENDPOINT_HOST_URL: string;
  INSTANA_ENDPOINT_HOST_PORT: string;
}