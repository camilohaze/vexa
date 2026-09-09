abstract final class SocketEvents {
  static const newJob = 'NEW_JOB';
  static const jobAccepted = 'JOB_ACCEPTED';
  static const jobCancelled = 'JOB_CANCELLED';
  static const courierLocation = 'COURIER_LOCATION';
  static const jobCompleted = 'JOB_COMPLETED';
  static const jobMessage = 'JOB_MESSAGE';
  static const jobSubscribe = 'JOB_SUBSCRIBE';

  static const all = [
    newJob,
    jobAccepted,
    jobCancelled,
    courierLocation,
    jobCompleted,
    jobMessage,
  ];
}
