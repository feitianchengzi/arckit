package handler

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

func isUniqueViolation(err error, constraintName string) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		if pgErr.Code == "23505" {
			if constraintName == "" {
				return true
			}
			return pgErr.ConstraintName == constraintName
		}
	}
	return false
}
