import { fromDatabaseEnum } from "@/lib/domain/mappers";
import { Role, SessionUser } from "@/types/domain";

type SessionUserRecord = {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export function toSessionUser(record: SessionUserRecord): SessionUser {
  return {
    id: record.id,
    clinicId: record.clinicId,
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    role: fromDatabaseEnum<Role>(record.role)
  };
}
