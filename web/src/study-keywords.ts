export type KeywordKind = 'constraint' | 'term' | 'number';
export type StudyTextPart = { text: string; kind?: KeywordKind };

// Match visible wording only. The answer key is deliberately not an input.
// Longer names take precedence so a feature stays together when highlighted.
const terms = [
  'SageMaker managed warm pools', 'managed warm pools', 'warm pools',
  'Managed Spot Training', 'SageMaker Training Compiler', 'Training Compiler',
  'distributed data parallelism', 'SMDDP', 'model parallelism',
  'SageMaker Model Monitor', 'SageMaker Model Registry', 'SageMaker Feature Store',
  'SageMaker Data Wrangler', 'SageMaker Clarify', 'SageMaker Canvas',
  'SageMaker JumpStart', 'SageMaker Pipelines', 'SageMaker Studio',
  'SageMaker Autopilot', 'SageMaker Neo', 'SageMaker Debugger',
  'SageMaker Experiments', 'SageMaker Ground Truth', 'SageMaker Processing',
  'SageMaker AI', 'SageMaker', 'Model Monitor', 'Model Registry', 'Feature Store',
  'Data Wrangler', 'Ground Truth', 'JumpStart', 'Clarify', 'Autopilot',
  'Step Functions', 'CloudWatch Logs', 'CloudWatch', 'CloudTrail',
  'Glue DataBrew', 'Glue Data Catalog', 'Glue', 'Lake Formation',
  'Managed Service for Apache Flink', 'Apache Flink', 'Apache Spark', 'Apache Zeppelin',
  'Kinesis Data Streams', 'Kinesis Data Firehose', 'Kinesis', 'Data Firehose', 'Firehose',
  'OpenSearch Serverless', 'OpenSearch Service', 'OpenSearch', 'Athena', 'Redshift',
  'Bedrock Knowledge Bases', 'Bedrock', 'Transcribe', 'Translate', 'Rekognition',
  'Comprehend Medical', 'Comprehend', 'Textract', 'Polly', 'Personalize', 'Forecast',
  'Macie', 'GuardDuty', 'Security Hub', 'Secrets Manager', 'Certificate Manager',
  'Systems Manager', 'EventBridge', 'CloudFormation', 'CodePipeline', 'CodeBuild',
  'CodeDeploy', 'Lambda', 'Fargate', 'DynamoDB', 'Aurora', 'DocumentDB',
  'ElastiCache', 'MemoryDB', 'DataSync', 'Snowball', 'Storage Gateway',
  'Elastic File System', 'FSx for Lustre', 'FSx', 'EMR', 'EKS', 'ECS', 'ECR',
  'S3 Glacier', 'S3', 'EC2', 'EBS', 'EFS', 'SQS', 'SNS', 'DMS', 'MSK',
  'IAM', 'KMS', 'VPC', 'NACL', 'ACL', 'API Gateway', 'Route 53',
  'VPC endpoint', 'VPC endpoints', 'security group', 'security groups',
  'network ACL', 'network ACLs', 'network isolation', 'private subnet',
  'private subnets', 'public subnet', 'public subnets',
  'interface endpoint', 'interface endpoints', 'gateway endpoint', 'gateway endpoints',
  'resource-based policy', 'identity-based policy', 'bucket policy',
  'execution role', 'service control policy', 'permissions boundary',
  'encryption at rest', 'encryption in transit', 'customer managed key',
  'customer-managed key', 'SSE-KMS', 'SSE-S3', 'TLS', 'PII', 'PHI',
  'Savings Plans', 'Savings Plan', 'Spot Instances', 'Spot Instance',
  'On-Demand Instances', 'Reserved Instances',
  'real-time endpoint', 'real-time endpoints', 'asynchronous inference',
  'serverless inference', 'batch transform', 'multi-model endpoint',
  'multi-model endpoints', 'multi-container endpoint', 'inference component',
  'inference components', 'target tracking', 'step scaling', 'scheduled scaling',
  'auto scaling', 'autoscaling', 'blue/green', 'canary', 'shadow testing',
  'data drift', 'concept drift', 'model drift', 'data quality', 'model quality',
  'ground truth', 'data leakage', 'class imbalance', 'bias drift',
  'overfitting', 'underfitting', 'oversampling', 'undersampling', 'SMOTE',
  'one-hot encoding', 'label encoding', 'ordinal encoding', 'binary encoding',
  'min-max scaling', 'standardization', 'normalization', 'imputation',
  'cross-validation', 'stratified sampling', 'random sampling', 'train-test split',
  'time series', 'seasonality', 'feature engineering', 'feature selection',
  'dimensionality reduction', 'principal component analysis', 'PCA',
  'learning rate', 'batch size', 'early stopping', 'dropout', 'regularization',
  'L1', 'L2', 'weight decay', 'gradient clipping', 'hyperparameter tuning',
  'Bayesian optimization', 'grid search', 'random search', 'Hyperband',
  'XGBoost', 'Linear Learner', 'Random Cut Forest', 'Factorization Machines',
  'K-means', 'K-nearest neighbors', 'KNN', 'DeepAR', 'BlazingText', 'Object2Vec',
  'TensorFlow', 'PyTorch', 'scikit-learn', 'Hugging Face',
  'precision', 'recall', 'F1 score', 'F1', 'ROC-AUC', 'AUC', 'RMSE', 'MAE', 'MSE',
  'accuracy', 'confusion matrix', 'false positives', 'false negatives',
  'binary classification', 'multiclass classification', 'regression', 'clustering',
  'reinforcement learning', 'supervised learning', 'unsupervised learning',
  'fine-tuning', 'fine tuning', 'prompt engineering', 'embeddings', 'vector database',
  'retrieval augmented generation', 'retrieval-augmented generation', 'RAG', 'LLM',
  'foundation model', 'foundation models', 'Stable Diffusion', 'Claude', 'Jurassic',
  'Titan', 'Llama', 'Jamba', 'Jupyter', 'SQL', 'JDBC', 'Parquet', 'CSV', 'JSON',
  'RecordIO', 'TFRecord', 'TF-IDF', 'NLP', 'CNN', 'RNN', 'LSTM', 'GPU', 'CPU',
  'TrainingInputMode', 'File mode', 'Pipe mode', 'FastFile', 'checkpoint', 'checkpoints',
  'DetectPiiEntities', 'DetectPHI', 'InvokeEndpoint', 'InvokeModel', 'PutRecord',
  'GetRecord', 'CreateModel', 'CreateTrainingJob', 'RegisterModel', 'QualityCheck',
  'InvocationsPerInstance', 'ConcurrentRequestsPerModel', 'ConcurrentRequestsPerCopy',
];
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const termPattern = [...new Set(terms)].sort((a,b)=>b.length-a.length).map(escape).join('|');
const constraints = [
  String.raw`(?:least|lowest|minimum|most|maximum)\s+(?:(?:amount\s+of|number\s+of)\s+)?(?:operational\s+overhead|administrative\s+overhead|management\s+overhead|development\s+effort|operational\s+effort|code\s+development|cost[- ]effectively|cost[- ]effective|cost|latency|time|accuracy|availability)`,
  String.raw`(?:minimi[sz]e|maximi[sz]e|reduce|increase|decrease|improve)\s+(?:infrastructure\s+)?(?:startup\s+times?|operational\s+overhead|latency|costs?|accuracy|throughput|availability)`,
  String.raw`choose\s+(?:one|two|three|four|five|six|[1-6])`,
  String.raw`must\s+not|does\s+not|do\s+not|is\s+not|cannot|can't|without|never|except`,
  String.raw`least|most|minimum|maximum|minimi[sz]e|maximi[sz]e|only|not|must`,
];
const matcher = new RegExp([
  `(?<constraint>\\b(?:${constraints.join('|')})\\b)`,
  `(?<term>\\b(?:(?:Amazon|AWS)\\s+)?(?:${termPattern})\\b)`,
  String.raw`(?<number>\b\d+(?:[.,]\d+)?\s*(?:%|(?:milliseconds?|seconds?|minutes?|hours?|days?|weeks?|months?|years?|TB|GB|MB|KB|ms|TPS|RPS)\b))`,
].join('|'), 'giu');

export function highlightStudyText(text: string): StudyTextPart[] {
  const parts: StudyTextPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(matcher)) {
    if (match.index > cursor) parts.push({text: text.slice(cursor,match.index)});
    const kind: KeywordKind = match.groups?.constraint ? 'constraint' : match.groups?.term ? 'term' : 'number';
    parts.push({text: match[0],kind});
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push({text: text.slice(cursor)});
  return parts;
}
