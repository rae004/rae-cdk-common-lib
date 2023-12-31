import { merge } from 'lodash';
import { Construct } from 'constructs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import {
  AuroraMysqlEngineVersion,
  ClusterInstance,
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
  DatabaseClusterProps,
} from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { SecretConstruct } from '../auth';
import {
  AppProps,
  DEFAULT_RDS_DB_NAME,
  DEFAULT_RDS_PORT,
  DEFAULT_RDS_USER,
} from '../shared';

export interface RdsConstructProps extends AppProps {
  rdsClusterProps: Partial<DatabaseClusterProps> & { vpc: Vpc };
  dbUserName?: string;
}

const defaultRdsClusterProps: Omit<
  DatabaseClusterProps,
  'vpc' | 'credentials'
> = {
  vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
  engine: DatabaseClusterEngine.auroraMysql({
    version: AuroraMysqlEngineVersion.VER_3_05_0,
  }),
  writer: ClusterInstance.serverlessV2('writer'),
  readers: [
    ClusterInstance.serverlessV2('reader1', {
      scaleWithWriter: true,
    }),
    ClusterInstance.serverlessV2('reader2'),
  ],
  defaultDatabaseName: DEFAULT_RDS_DB_NAME,
  storageEncrypted: true,
  iamAuthentication: true,
  deletionProtection: false,
  backtrackWindow: Duration.hours(24),
  removalPolicy: RemovalPolicy.DESTROY,
  port: DEFAULT_RDS_PORT,
  serverlessV2MaxCapacity: 1,
  serverlessV2MinCapacity: 0.5,
};
export class RdsClusterConstruct extends Construct {
  readonly db: DatabaseCluster;
  readonly dbSecret: Secret;
  constructor(scope: Construct, id: string, props: RdsConstructProps) {
    super(scope, id);

    const appName = `${props.appName}-${props.deploymentEnvironment}`;

    this.dbSecret = new SecretConstruct(this, `${appName}-db-cluster-secret`, {
      deploymentEnvironment: props.deploymentEnvironment,
      appName: props.appName,
    }).secret;

    const dbClusterProps: DatabaseClusterProps = merge(
      defaultRdsClusterProps,
      {
        credentials: Credentials.fromPassword(
          props.dbUserName ?? DEFAULT_RDS_USER,
          this.dbSecret.secretValue,
        ),
        databaseName: `${appName.replace('-', '')}${DEFAULT_RDS_DB_NAME}`,
      },
      props.rdsClusterProps,
    );

    this.db = new DatabaseCluster(
      this,
      `${appName}-rds-cluster`,
      dbClusterProps,
    );
  }
}
