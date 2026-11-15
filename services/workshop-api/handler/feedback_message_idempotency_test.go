package handler

import (
	"sync"
	"testing"

	"todo/models"

	"gorm.io/gorm"
)

func TestConcurrentCustomerMessageRetriesDoNotAbortTransactions(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	fixture := seedFeedbackWorkflowFixture(t, db)
	feedback := fixture.createFeedback(t, "pending")
	customer, clientID := "concurrent-customer", "same-operation"
	// Keep the insertion overlap wide enough to exercise the unique-violation
	// recovery rather than only the fast path that finds an existing message.
	if err := db.Exec(`CREATE FUNCTION delay_customer_message_insert() RETURNS trigger AS $$ BEGIN PERFORM pg_sleep(0.05); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER delay_customer_message BEFORE INSERT ON feedback_messages FOR EACH ROW EXECUTE FUNCTION delay_customer_message_insert();`).Error; err != nil {
		t.Fatal(err)
	}
	type outcome struct {
		id      uint
		created bool
		err     error
	}
	const workers = 12
	results := make(chan outcome, workers)
	start := make(chan struct{})
	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			var message models.FeedbackMessage
			var created bool
			err := db.Transaction(func(tx *gorm.DB) error {
				var err error
				message, created, err = createCustomerMessageWithIdempotency(tx, feedback, &customer, &clientID, "same customer message", nil, nil)
				return err
			})
			results <- outcome{message.ID, created, err}
		}()
	}
	close(start)
	wg.Wait()
	close(results)
	var winner uint
	createdCount := 0
	for result := range results {
		if result.err != nil {
			t.Fatal(result.err)
		}
		if winner == 0 {
			winner = result.id
		}
		if result.id != winner || result.id == 0 {
			t.Fatalf("different message IDs: %d vs %d", winner, result.id)
		}
		if result.created {
			createdCount++
		}
	}
	var count int64
	if err := db.Model(&models.FeedbackMessage{}).Where("feedback_id = ? AND client_message_id = ?", feedback.ID, clientID).Count(&count).Error; err != nil {
		t.Fatal(err)
	}
	if count != 1 || createdCount != 1 {
		t.Fatalf("rows=%d created=%d; want exactly one", count, createdCount)
	}
}
