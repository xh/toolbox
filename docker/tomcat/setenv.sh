# Sets default JVM Xmx (max heap) of 2gb, unless overridden by optional JAVA_XMX env var.
# Instance config is sourced from APP_TOOLBOX_* environment variables (and AWS Secrets Manager
# for secret values), so no -Dio.xh.hoist.instanceConfigFile is set here.
export JAVA_OPTS="$JAVA_OPTS -Xmx${JAVA_XMX:-2G}"