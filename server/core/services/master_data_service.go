package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/greenfields/server/core/models"
	"github.com/greenfields/server/core/repository"
	"github.com/greenfields/server/pkg/utils"
)

type MasterDataService struct {
	repo repository.MasterDataRepository
}

func NewMasterDataService(repo repository.MasterDataRepository) *MasterDataService {
	return &MasterDataService{repo: repo}
}

// ─── Areas ───────────────────────────────────────────────────────────────────

func (s *MasterDataService) ListAreas(ctx context.Context) ([]*models.Area, error) {
	return s.repo.ListAreas(ctx)
}

func (s *MasterDataService) FindAreaByID(ctx context.Context, id uuid.UUID) (*models.Area, error) {
	return s.repo.FindAreaByID(ctx, id)
}

func (s *MasterDataService) CreateArea(ctx context.Context, req *models.CreateMasterDataRequest) (*models.Area, error) {
	existing, err := s.repo.FindAreaByCode(ctx, req.Code)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("%w: area code %q already exists", utils.ErrConflict, req.Code)
	}
	return s.repo.CreateArea(ctx, req)
}

func (s *MasterDataService) UpdateArea(ctx context.Context, id uuid.UUID, req *models.UpdateMasterDataRequest) (*models.Area, error) {
	existing, err := s.repo.FindAreaByCode(ctx, req.Code)
	if err == nil && existing != nil && existing.ID != id {
		return nil, fmt.Errorf("%w: area code %q already exists", utils.ErrConflict, req.Code)
	}
	return s.repo.UpdateArea(ctx, id, req)
}

func (s *MasterDataService) DeleteArea(ctx context.Context, id uuid.UUID) error {
	if _, err := s.repo.FindAreaByID(ctx, id); err != nil {
		return err
	}
	return s.repo.DeleteArea(ctx, id)
}

// ─── Lines ───────────────────────────────────────────────────────────────────

func (s *MasterDataService) ListLines(ctx context.Context) ([]*models.Line, error) {
	return s.repo.ListLines(ctx)
}

func (s *MasterDataService) FindLineByID(ctx context.Context, id uuid.UUID) (*models.Line, error) {
	return s.repo.FindLineByID(ctx, id)
}

func (s *MasterDataService) CreateLine(ctx context.Context, req *models.CreateMasterDataRequest) (*models.Line, error) {
	existing, err := s.repo.FindLineByCode(ctx, req.Code)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("%w: line code %q already exists", utils.ErrConflict, req.Code)
	}
	return s.repo.CreateLine(ctx, req)
}

func (s *MasterDataService) UpdateLine(ctx context.Context, id uuid.UUID, req *models.UpdateMasterDataRequest) (*models.Line, error) {
	existing, err := s.repo.FindLineByCode(ctx, req.Code)
	if err == nil && existing != nil && existing.ID != id {
		return nil, fmt.Errorf("%w: line code %q already exists", utils.ErrConflict, req.Code)
	}
	return s.repo.UpdateLine(ctx, id, req)
}

func (s *MasterDataService) DeleteLine(ctx context.Context, id uuid.UUID) error {
	if _, err := s.repo.FindLineByID(ctx, id); err != nil {
		return err
	}
	return s.repo.DeleteLine(ctx, id)
}

// ─── MachineTypes ─────────────────────────────────────────────────────────────

func (s *MasterDataService) ListMachineTypes(ctx context.Context) ([]*models.MachineType, error) {
	return s.repo.ListMachineTypes(ctx)
}

func (s *MasterDataService) FindMachineTypeByID(ctx context.Context, id uuid.UUID) (*models.MachineType, error) {
	return s.repo.FindMachineTypeByID(ctx, id)
}

func (s *MasterDataService) CreateMachineType(ctx context.Context, req *models.CreateMasterDataRequest) (*models.MachineType, error) {
	existing, err := s.repo.FindMachineTypeByCode(ctx, req.Code)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("%w: machine type code %q already exists", utils.ErrConflict, req.Code)
	}
	return s.repo.CreateMachineType(ctx, req)
}

func (s *MasterDataService) UpdateMachineType(ctx context.Context, id uuid.UUID, req *models.UpdateMasterDataRequest) (*models.MachineType, error) {
	existing, err := s.repo.FindMachineTypeByCode(ctx, req.Code)
	if err == nil && existing != nil && existing.ID != id {
		return nil, fmt.Errorf("%w: machine type code %q already exists", utils.ErrConflict, req.Code)
	}
	return s.repo.UpdateMachineType(ctx, id, req)
}

func (s *MasterDataService) DeleteMachineType(ctx context.Context, id uuid.UUID) error {
	if _, err := s.repo.FindMachineTypeByID(ctx, id); err != nil {
		return err
	}
	return s.repo.DeleteMachineType(ctx, id)
}
