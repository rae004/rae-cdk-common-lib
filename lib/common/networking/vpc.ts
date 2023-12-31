import { merge } from 'lodash';
import { Construct } from 'constructs';
import { BucketProps } from 'aws-cdk-lib/aws-s3';
import {
  FlowLogDestination,
  SubnetType,
  Vpc,
  VpcProps,
} from 'aws-cdk-lib/aws-ec2';
import { s3Construct } from '@/lib/common/storage';
import { AppProps } from '@/lib/common/shared';

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
      const serverAccessLogsBucket = new s3Construct(
        this,
        `${appName}-flow-logs-server-access-log`,
        { ...serverAccessLogBucketProps, ...appProps },
      ).bucket;
      const vpcFlowLogBucket = new s3Construct(this, `${appName}-flow-logs`, {
        serverAccessLogsBucket: serverAccessLogsBucket,
        ...vpcFlowLogBucketProps,
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
