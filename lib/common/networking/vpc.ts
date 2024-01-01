import { merge } from 'lodash';
import { Construct } from 'constructs';
import {
  BlockPublicAccess,
  BucketEncryption,
  BucketProps,
} from 'aws-cdk-lib/aws-s3';
import {
  FlowLogDestination,
  SubnetType,
  Vpc,
  VpcProps,
} from 'aws-cdk-lib/aws-ec2';
import { s3Construct } from '../storage';
import { AppProps } from '../shared';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';

export interface VpcConstructProps extends AppProps {
  vpcProps?: VpcProps;
  s3BucketProps?: BucketProps;
  flowLogProps?: {
    serverAccessLogBucketProps: BucketProps;
    vpcFlowLogBucketProps: BucketProps;
  };
}

const getDefaultVpcConfig: VpcProps = {
  maxAzs: 2,
  subnetConfiguration: [
    {
      cidrMask: 24,
      name: 'ingress',
      subnetType: SubnetType.PUBLIC,
    },
    {
      cidrMask: 24,
      name: 'application',
      subnetType: SubnetType.PRIVATE_WITH_EGRESS,
    },
    {
      cidrMask: 28,
      name: 'rds',
      subnetType: SubnetType.PRIVATE_ISOLATED,
    },
  ],
};

export class VpcConstruct extends Construct {
  readonly vpc: Vpc;
  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const appName = `${props.appName}-${props.deploymentEnvironment}-vpc`;
    const appProps = {
      appName: props.appName,
      deploymentEnvironment: props.deploymentEnvironment,
    };

    let vpcFlowLogProps = {};
    if (props?.flowLogProps) {
      const { serverAccessLogBucketProps, vpcFlowLogBucketProps } =
        props.flowLogProps;
      const serverAccessLogsBucket = new Bucket(
        this,
        `${appName}-server-access-flow-log`,
        {
          bucketName: `${appName}-server-access-flow-log`,
          encryption: BucketEncryption.S3_MANAGED,
          blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
          enforceSSL: true,
          removalPolicy: RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          ...serverAccessLogBucketProps,
        },
      );

      const vpcFlowLogBucket = new s3Construct(this, `${appName}-flow-logs`, {
        s3BucketProps: {
          serverAccessLogsBucket: serverAccessLogsBucket,
          ...vpcFlowLogBucketProps,
        },
        ...appProps,
      }).bucket;

      vpcFlowLogProps = {
        flowLogs: {
          s3: {
            destination: FlowLogDestination.toS3(
              vpcFlowLogBucket,
              `${appName}-access-log`,
            ),
          },
        },
      };
    }

    const vpcProps = merge(
      getDefaultVpcConfig,
      vpcFlowLogProps,
      props?.vpcProps,
    );

    this.vpc = new Vpc(this, 'app-vpc', vpcProps);
  }
}
