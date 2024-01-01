import { merge } from 'lodash';
import { Construct } from 'constructs';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { BucketProps } from 'aws-cdk-lib/aws-s3';
import { EnableScalingProps } from 'aws-cdk-lib/aws-applicationautoscaling';
import {
  FargateTaskDefinitionProps,
  ContainerDefinitionProps,
  MountPoint,
  Cluster,
} from 'aws-cdk-lib/aws-ecs';
import {
  ApplicationLoadBalancedFargateService,
  ApplicationLoadBalancedFargateServiceProps,
} from 'aws-cdk-lib/aws-ecs-patterns';
import { s3Construct } from '../../storage';
import { FargateTaskDefinitionConstruct } from '../ecs';
import { ContainerDefinitionConstruct } from '../ecs';
import { AppProps } from '../../shared';

export interface LbFargateServiceProps extends AppProps {
  containerDefinitionProps: Omit<ContainerDefinitionProps, 'taskDefinition'> & {
    mountPoints?: MountPoint[];
  };
  lbFargateServiceProps: ApplicationLoadBalancedFargateServiceProps &
    ({ vpc: Vpc } | { cluster: Cluster });
  fargateTaskDefinitionProps?: FargateTaskDefinitionProps;
  lbAccessLogProps?: {
    serverAccessLogsBucketProps: BucketProps;
    loadBalancerAccessLogBucketProps: BucketProps;
  };
  fargateAutoScalingProps?: {
    enableScalingProps?: EnableScalingProps;
    targetUtilizationPercentCpu?: number;
    targetUtilizationPercentMem?: number;
  };
}

const defaultLbFargateServiceConfig: ApplicationLoadBalancedFargateServiceProps =
  {
    desiredCount: 2,
    taskSubnets: {
      subnetType: SubnetType.PRIVATE_WITH_EGRESS,
    },
    circuitBreaker: { rollback: true },
  };
const defaultFargateAutoScalingConfig = {
  enableScalingProps: {
    minCapacity: 2,
    maxCapacity: 15,
  },
  targetUtilizationPercentCpu: 50,
  targetUtilizationPercentMem: 50,
};

export class LbFargateServiceConstruct extends Construct {
  readonly lbFargateService: ApplicationLoadBalancedFargateService;
  constructor(scope: Construct, id: string, props: LbFargateServiceProps) {
    super(scope, id);

    const appName = `${props.appName}-${props.deploymentEnvironment}`;
    const appProps = {
      deploymentEnvironment: props.deploymentEnvironment,
      appName: props.appName,
    };

    // Create Fargate Task Definition.
    const fargateTaskDefinitionProps = merge(
      appProps,
      props?.fargateTaskDefinitionProps,
    );
    const { fargateTaskDefinition } = new FargateTaskDefinitionConstruct(
      this,
      `${appName}-fargate-task-definition`,
      fargateTaskDefinitionProps,
    );

    // Create Container Definition for Fargate Task Definition.
    const containerDefinitionProps = merge(appProps, {
      containerDefinitionProps: {
        taskDefinition: fargateTaskDefinition,
        ...props.containerDefinitionProps,
      },
    });
    new ContainerDefinitionConstruct(
      this,
      `${appName}-ecs-container-definition`,
      containerDefinitionProps,
    );

    // Create a load-balanced Fargate service and make it public.
    const fargateServicePropsWithTaskDefinition = {
      taskDefinition: fargateTaskDefinition,
      ...props.lbFargateServiceProps,
    };
    const lbFargateServiceProps = merge(
      defaultLbFargateServiceConfig,
      fargateServicePropsWithTaskDefinition,
    );
    this.lbFargateService = new ApplicationLoadBalancedFargateService(
      this,
      `${appName}-lb-fargate-service`,
      lbFargateServiceProps,
    );

    // Add access logs bucket to lb
    if (props.lbAccessLogProps) {
      const { serverAccessLogsBucketProps, loadBalancerAccessLogBucketProps } =
        props.lbAccessLogProps;
      const serverAccessLogsBucket = new s3Construct(
        this,
        `${appName}-lb-fargate-server-access-log`,
        { s3BucketProps: serverAccessLogsBucketProps, ...appProps },
      ).bucket;
      const loadBalancerAccessLogBucket = new s3Construct(
        this,
        `${appName}-lb-fargate-access-log`,
        {
          s3BucketProps: {
            serverAccessLogsBucket: serverAccessLogsBucket,
            ...loadBalancerAccessLogBucketProps,
          },
          ...appProps,
        },
      ).bucket;
      this.lbFargateService.loadBalancer.logAccessLogs(
        loadBalancerAccessLogBucket,
      );
    }

    // Auto-scale the fargate service based on CPU/Memory utilization
    const enableScalingProps =
      props.fargateAutoScalingProps?.enableScalingProps ??
      defaultFargateAutoScalingConfig.enableScalingProps;
    const targetUtilizationPercentCpu =
      props.fargateAutoScalingProps?.targetUtilizationPercentCpu ??
      defaultFargateAutoScalingConfig.targetUtilizationPercentCpu;
    const targetUtilizationPercentMem =
      props.fargateAutoScalingProps?.targetUtilizationPercentMem ??
      defaultFargateAutoScalingConfig.targetUtilizationPercentMem;

    const targetScaling =
      this.lbFargateService.service.autoScaleTaskCount(enableScalingProps);
    targetScaling.scaleOnCpuUtilization(`${appName}-cpu-scaling`, {
      targetUtilizationPercent: targetUtilizationPercentCpu,
    });
    targetScaling.scaleOnMemoryUtilization(`${appName}-memory-scaling`, {
      targetUtilizationPercent: targetUtilizationPercentMem,
    });
  }
}
