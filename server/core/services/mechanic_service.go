package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/greenfields/server/core/models"
	"github.com/greenfields/server/core/repository"
	"github.com/greenfields/server/pkg/utils"
)

type MechanicService struct {
	repo repository.MechanicRepository
}

func NewMechanicService(repo repository.MechanicRepository) *MechanicService {
	return &MechanicService{repo: repo}
}

func (s *MechanicService) CreateMechanic(ctx context.Context, req *models.CreateMechanicRequest) (*models.Mechanic, error) {
	// Check if email already registered
	existing, err := s.repo.FindByEmail(ctx, req.Email)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("%w: Email mekanik sudah terdaftar", utils.ErrConflict)
	}

	return s.repo.Create(ctx, req)
}

func (s *MechanicService) GetMechanic(ctx context.Context, id uuid.UUID) (*models.Mechanic, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *MechanicService) ListMechanics(ctx context.Context) ([]*models.Mechanic, error) {
	return s.repo.List(ctx)
}

func (s *MechanicService) UpdateMechanic(ctx context.Context, id uuid.UUID, req *models.UpdateMechanicRequest) (*models.Mechanic, error) {
	// Check if email belongs to someone else
	existing, err := s.repo.FindByEmail(ctx, req.Email)
	if err == nil && existing != nil && existing.ID != id {
		return nil, fmt.Errorf("%w: Email mekanik sudah terdaftar untuk mekanik lain", utils.ErrConflict)
	}

	return s.repo.Update(ctx, id, req)
}

func (s *MechanicService) DeleteMechanic(ctx context.Context, id uuid.UUID) error {
	// Check if mechanic exists
	_, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	return s.repo.Delete(ctx, id)
}
