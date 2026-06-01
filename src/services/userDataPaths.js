import { collection, doc } from "firebase/firestore";
import { assertUid, getUserRootPath, getUserStatePath } from "../core/userScope";

export function userStatePath(uid) {
  return getUserStatePath(uid);
}

export function userActivityPath(uid) {
  return [...getUserRootPath(uid), "activityLog"];
}

export function userBackupPath(uid) {
  return [...getUserRootPath(uid), "backups"];
}

export function userCalendarImportPath(uid) {
  return [...getUserRootPath(uid), "calendarImports"];
}

export function userStateDoc(db, uid) {
  return doc(db, ...userStatePath(assertUid(uid)));
}

export function userActivityCollection(db, uid) {
  return collection(db, ...userActivityPath(assertUid(uid)));
}

export function userBackupCollection(db, uid) {
  return collection(db, ...userBackupPath(assertUid(uid)));
}

