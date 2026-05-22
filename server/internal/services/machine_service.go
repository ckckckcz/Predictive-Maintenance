package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/internal/repository"
	"github.com/greenfields/server/pkg/utils"
)

// MachineService handles business logic for machine management.
type MachineService struct {
	machines repository.MachineRepository
}

func NewMachineService(machines repository.MachineRepository) *MachineService {
	return &MachineService{machines: machines}
}

func (s *MachineService) ListMachines(ctx context.Context) ([]*models.Machine, error) {
	return s.machines.List(ctx)
}

func (s *MachineService) GetMachine(ctx context.Context, id uuid.UUID) (*models.Machine, error) {
	machine, err := s.machines.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return machine, nil
}

// CreateMachine validates uniqueness then persists. SUPERVISOR only (enforced at handler).
func (s *MachineService) CreateMachine(ctx context.Context, req *models.CreateMachineRequest) (*models.Machine, error) {
	// Check code uniqueness
	existing, err := s.machines.FindByCode(ctx, req.Code)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("%w: machine code %q already exists", utils.ErrConflict, req.Code)
	}

	return s.machines.Create(ctx, req)
}

// UpdateMachineStatus changes the operational status of a machine.
func (s *MachineService) UpdateMachineStatus(ctx context.Context, id uuid.UUID, req *models.UpdateMachineStatusRequest) error {
	// Verify machine exists first
	if _, err := s.machines.FindByID(ctx, id); err != nil {
		return err
	}
	return s.machines.UpdateStatus(ctx, id, req.Status)
}
