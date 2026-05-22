package services

import (
	"context"
	"log"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"github.com/greenfields/server/internal/models"
	"github.com/greenfields/server/internal/repository"
)

// SimulatorService generates synthetic telemetry readings for active virtual machines.
type SimulatorService struct {
	machineRepo repository.MachineRepository
	sensorSvc   *SensorService
	geminiSvc   *GeminiService
	rng         *rand.Rand
}

func NewSimulatorService(machineRepo repository.MachineRepository, sensorSvc *SensorService, geminiSvc *GeminiService) *SimulatorService {
	return &SimulatorService{
		machineRepo: machineRepo,
		sensorSvc:   sensorSvc,
		geminiSvc:   geminiSvc,
		rng:         rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// Start launches the simulation ticker in a background goroutine.
func (s *SimulatorService) Start(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		defer ticker.Stop()
		log.Printf("🤖 IoT Simulator started (interval: %v)", interval)
		for {
			select {
			case <-ctx.Done():
				log.Println("🛑 IoT Simulator stopping...")
				return
			case <-ticker.C:
				s.runSimulationStep(ctx)
			}
		}
	}()
}

func (s *SimulatorService) runSimulationStep(ctx context.Context) {
	machines, err := s.machineRepo.List(ctx)
	if err != nil {
		log.Printf("🤖 Simulator error: failed to list machines: %v", err)
		return
	}

	for _, m := range machines {
		if m.Status != models.MachineStatusActive {
			continue
		}

		req := s.generateReading(m.ID, m.Code)
		if req == nil {
			continue
		}

		result, err := s.sensorSvc.IngestReading(ctx, req)
		if err != nil {
			log.Printf("🤖 Simulator error: failed to ingest reading for machine %s (%s): %v", m.Name, m.Code, err)
			continue
		}

		// If an anomaly was detected, trigger AI analysis asynchronously (non-blocking)
		if result != nil && result.Reading != nil && result.Reading.IsAnomaly && s.geminiSvc != nil {
			machineID := m.ID
			go func() {
				if _, err := s.geminiSvc.Analyze(context.Background(), machineID); err != nil {
					log.Printf("⚠️ Async Gemini analysis failed for %s: %v", m.Code, err)
				}
			}()
		}
	}
}

func (s *SimulatorService) generateReading(machineID uuid.UUID, code string) *models.CreateSensorReadingRequest {
	req := &models.CreateSensorReadingRequest{
		MachineID: machineID,
	}

	// 15% chance of generating an anomaly
	isAnomaly := s.rng.Float64() < 0.15

	// Efficiency: normal 80-99%, anomaly 40-79%
	var efficiency float64
	if isAnomaly {
		efficiency = 40.0 + s.rng.Float64()*39.9
	} else {
		efficiency = 80.0 + s.rng.Float64()*19.9
	}
	req.Efficiency = &efficiency

	switch code {
	case "PST-001": // Mesin Pasteurisasi #1: suhu (72-75°C normal)
		var temp float64
		if isAnomaly {
			if s.rng.Float64() < 0.5 {
				temp = 55.0 + s.rng.Float64()*16.9 // 55.0 - 71.9 (Anomaly - Low)
			} else {
				temp = 75.1 + s.rng.Float64()*14.9 // 75.1 - 90.0 (Anomaly - High)
			}
		} else {
			temp = 72.0 + s.rng.Float64()*3.0 // 72.0 - 75.0 (Normal)
		}
		req.Temperature = &temp

	case "FLL-002": // Mesin Filling #2: getaran (< 2.5Hz normal)
		var vib float64
		if isAnomaly {
			vib = 2.5 + s.rng.Float64()*3.5 // 2.5 - 6.0 (Anomaly)
		} else {
			vib = 0.5 + s.rng.Float64()*1.9 // 0.5 - 2.4 (Normal)
		}
		req.Vibration = &vib

	case "CNV-001": // Conveyor Belt A: RPM (800-1200 normal) & tekanan (1.5-4.0 Bar normal)
		var rpm int
		var pres float64
		if isAnomaly {
			r := s.rng.Float64()
			if r < 0.4 {
				// RPM anomaly
				if s.rng.Float64() < 0.5 {
					rpm = int(300 + s.rng.Intn(499)) // 300 - 799
				} else {
					rpm = int(1201 + s.rng.Intn(599)) // 1201 - 1799
				}
				pres = 1.5 + s.rng.Float64()*2.5 // normal pressure
			} else if r < 0.8 {
				// Pressure anomaly
				rpm = int(800 + s.rng.Intn(400)) // normal RPM
				if s.rng.Float64() < 0.5 {
					pres = 0.2 + s.rng.Float64()*1.2 // 0.2 - 1.4
				} else {
					pres = 4.1 + s.rng.Float64()*4.9 // 4.1 - 9.0
				}
			} else {
				// Both anomalies
				if s.rng.Float64() < 0.5 {
					rpm = int(300 + s.rng.Intn(499))
				} else {
					rpm = int(1201 + s.rng.Intn(599))
				}
				if s.rng.Float64() < 0.5 {
					pres = 0.2 + s.rng.Float64()*1.2
				} else {
					pres = 4.1 + s.rng.Float64()*4.9
				}
			}
		} else {
			rpm = int(800 + s.rng.Intn(400))
			pres = 1.5 + s.rng.Float64()*2.5
		}
		req.RPM = &rpm
		req.Pressure = &pres

	case "CLD-003": // Cold Storage #3: suhu (2-4°C normal)
		var temp float64
		if isAnomaly {
			if s.rng.Float64() < 0.5 {
				temp = -10.0 + s.rng.Float64()*11.9 // -10.0 - 1.9
			} else {
				temp = 4.1 + s.rng.Float64()*15.9 // 4.1 - 20.0
			}
		} else {
			temp = 2.0 + s.rng.Float64()*2.0 // 2.0 - 4.0
		}
		req.Temperature = &temp

	case "BLR-001": // Boiler Unit: suhu (90-110°C normal) & tekanan (2.0-6.0 Bar normal)
		var temp float64
		var pres float64
		if isAnomaly {
			r := s.rng.Float64()
			if r < 0.4 {
				// Temp anomaly
				if s.rng.Float64() < 0.5 {
					temp = 40.0 + s.rng.Float64()*49.0 // 40 - 89
				} else {
					temp = 111.0 + s.rng.Float64()*49.0 // 111 - 160
				}
				pres = 2.0 + s.rng.Float64()*4.0 // normal pressure
			} else if r < 0.8 {
				// Pres anomaly
				temp = 90.0 + s.rng.Float64()*20.0 // normal temp
				if s.rng.Float64() < 0.5 {
					pres = 0.2 + s.rng.Float64()*1.7 // 0.2 - 1.9
				} else {
					pres = 6.1 + s.rng.Float64()*4.9 // 6.1 - 11.0
				}
			} else {
				// Both anomalies
				if s.rng.Float64() < 0.5 {
					temp = 40.0 + s.rng.Float64()*49.0
				} else {
					temp = 111.0 + s.rng.Float64()*49.0
				}
				if s.rng.Float64() < 0.5 {
					pres = 0.2 + s.rng.Float64()*1.7
				} else {
					pres = 6.1 + s.rng.Float64()*4.9
				}
			}
		} else {
			temp = 90.0 + s.rng.Float64()*20.0
			pres = 2.0 + s.rng.Float64()*4.0
		}
		req.Temperature = &temp
		req.Pressure = &pres

	default:
		return nil
	}

	return req
}
