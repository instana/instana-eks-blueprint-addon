import {
    KubernetesManifest,
    ICluster
  } from "aws-cdk-lib/aws-eks";
  import {
    ClusterAddOn,
    ClusterInfo,
  } from "@aws-quickstart/eks-blueprints/dist/spi";
  import {
    loadExternalYaml
  } from "@aws-quickstart/eks-blueprints/dist/utils/yaml-utils";
  
  export interface InstanaAddOnProps {
    /**
     * Zone of the host
     */
    zone?: string;
  
    /**
     * EKS cluster name
     */
    cluster_name?: string;
  
    /**
     * Instana agent key
     */
    instana_agent_key?: string;
  
    /**
     * Instana backend host name
     */
    endpoint_host?: string;
  
    /**
     * Instana backend host port
     */
    endpoint_port?: string;
  
    /**
     * Instana agent env tag name
     */
    instana_agent_env_tag_name?: string;
  }
  
  export class InstanaOperatorAddon implements ClusterAddOn {
    props: InstanaAddOnProps;
    constructor(defaultProps: InstanaAddOnProps) {
      this.props = defaultProps;
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
  
      const fileContent = loadExternalYaml(
        "https://github.com/arpitn2020/instana-eks-blueprint/releases/download/instana-agent/instana_v1beta1_instanaagent.yaml"
      ).slice(0, 1);
    
      fileContent[0].spec.zone.name = this.props.zone;
      fileContent[0].spec.cluster.name = this.props.cluster_name;
      fileContent[0].spec.agent.key = this.props.instana_agent_key;
      fileContent[0].spec.agent.endpointHost = this.props.endpoint_host;
      fileContent[0].spec.agent.endpointPort = this.props.endpoint_port;
      fileContent[0].spec.agent.env.INSTANA_AGENT_TAGS =
        this.props.instana_agent_env_tag_name;
      manifest = fileContent;
      console.log("############################################################");
      console.log(manifest);
      console.log("############################################################");
      const km1 = new KubernetesManifest(
        cluster.stack,
        "instana_v1beta1_instanaagent",
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
    }
  }  