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

// UpdateMachine updates details of a machine.
func (s *MachineService) UpdateMachine(ctx context.Context, id uuid.UUID, req *models.UpdateMachineRequest) (*models.Machine, error) {
	// Verify machine exists
	if _, err := s.machines.FindByID(ctx, id); err != nil {
		return nil, err
	}

	// Check code uniqueness (if changed)
	existing, err := s.machines.FindByCode(ctx, req.Code)
	if err == nil && existing != nil && existing.ID != id {
		return nil, fmt.Errorf("%w: machine code %q already exists", utils.ErrConflict, req.Code)
	}

	return s.machines.Update(ctx, id, req)
}

// DeleteMachine deletes a machine and cascade references.
func (s *MachineService) DeleteMachine(ctx context.Context, id uuid.UUID) error {
	// Verify machine exists
	if _, err := s.machines.FindByID(ctx, id); err != nil {
		return err
	}
	return s.machines.Delete(ctx, id)
}

func (s *MachineService) MechanicExistsByEmail(ctx context.Context, email string) (bool, error) {
	return s.machines.MechanicExistsByEmail(ctx, email)
}
