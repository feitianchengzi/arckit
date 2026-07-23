package handler

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestBuildFeedbackUploadPolicyScopesExactUpload(t *testing.T) {
	now := time.Date(2026, time.July, 15, 8, 30, 45, 0, time.UTC)
	objectKey := "workshop/feedbacks/v2/12/customer-hash/upload.png"
	result, err := buildFeedbackUploadPolicy(
		"test-access-key",
		"test-access-secret",
		"feedback-bucket",
		"cn-hangzhou",
		objectKey,
		"image/png",
		1024,
		now,
	)
	if err != nil {
		t.Fatalf("build policy: %v", err)
	}
	if result.ObjectKey != objectKey {
		t.Fatalf("object key = %q, want %q", result.ObjectKey, objectKey)
	}
	if result.UploadURL != "https://feedback-bucket.oss-cn-hangzhou.aliyuncs.com" {
		t.Fatalf("upload URL = %q", result.UploadURL)
	}

	policyJSON, err := base64.StdEncoding.DecodeString(result.Fields["policy"])
	if err != nil {
		t.Fatalf("decode policy: %v", err)
	}
	var policy struct {
		Expiration string            `json:"expiration"`
		Conditions []json.RawMessage `json:"conditions"`
	}
	if err := json.Unmarshal(policyJSON, &policy); err != nil {
		t.Fatalf("unmarshal policy: %v", err)
	}
	if policy.Expiration != "2026-07-15T08:40:45.000Z" {
		t.Fatalf("expiration = %q", policy.Expiration)
	}
	conditions := string(policyJSON)
	for _, expected := range []string{
		`["content-length-range",1024,1024]`,
		`["eq","$key","workshop/feedbacks/v2/12/customer-hash/upload.png"]`,
		`["in","$content-type",["image/png"]]`,
	} {
		if !strings.Contains(conditions, expected) {
			t.Fatalf("policy does not lock expected condition %s: %s", expected, conditions)
		}
	}

	dateKey := hmacSHA256([]byte("aliyun_v4test-access-secret"), "20260715")
	regionKey := hmacSHA256(dateKey, "cn-hangzhou")
	serviceKey := hmacSHA256(regionKey, "oss")
	signingKey := hmacSHA256(serviceKey, "aliyun_v4_request")
	expectedSignature := hex.EncodeToString(hmacSHA256(signingKey, result.Fields["policy"]))
	if result.Fields["x-oss-signature"] != expectedSignature {
		t.Fatalf("signature = %q, want %q", result.Fields["x-oss-signature"], expectedSignature)
	}
}

func TestFeedbackSessionReadPolicyCannotWriteObjects(t *testing.T) {
	policy, err := buildFeedbackOSSPolicy("feedback-bucket", "feedbacks/v2/12/")
	if err != nil {
		t.Fatalf("build read policy: %v", err)
	}
	if strings.Contains(policy, "PutObject") {
		t.Fatalf("read policy unexpectedly grants PutObject: %s", policy)
	}
	if !strings.Contains(policy, "GetObject") {
		t.Fatalf("read policy does not grant GetObject: %s", policy)
	}
}

func TestFeedbackAttachmentReadPolicyScopesOneObject(t *testing.T) {
	objectKey := "workshop/comments/feedback-reply.pdf"
	policy, err := buildFeedbackOSSObjectPolicy("feedback-bucket", objectKey)
	if err != nil {
		t.Fatalf("build attachment read policy: %v", err)
	}
	if strings.Contains(policy, "PutObject") {
		t.Fatalf("attachment read policy unexpectedly grants PutObject: %s", policy)
	}
	if strings.Contains(policy, objectKey+"*") {
		t.Fatalf("attachment read policy must not grant an object prefix: %s", policy)
	}
	if !strings.Contains(policy, "feedback-bucket/"+objectKey) {
		t.Fatalf("attachment read policy does not grant the requested object: %s", policy)
	}
}

func TestFeedbackAttachmentReadPolicyNormalizesLegacyObjectKey(t *testing.T) {
	policy, err := buildFeedbackOSSObjectPolicy("feedback-bucket", "/workshop/feedbacks/legacy.png")
	if err != nil {
		t.Fatalf("build legacy attachment read policy: %v", err)
	}
	if !strings.Contains(policy, "feedback-bucket/workshop/feedbacks/legacy.png") {
		t.Fatalf("policy does not grant the normalized legacy object: %s", policy)
	}
	if strings.Contains(policy, "feedback-bucket//workshop") {
		t.Fatalf("policy preserves an invalid leading slash: %s", policy)
	}
}

func TestFeedbackAttachmentMetadataConstraints(t *testing.T) {
	if _, err := validateFeedbackAttachmentMetadata("image", "image/png", feedbackImageMaxSize); err != nil {
		t.Fatalf("valid image metadata rejected: %v", err)
	}
	if _, err := validateFeedbackAttachmentMetadata("image", "image/png", feedbackImageMaxSize+1); err == nil {
		t.Fatal("oversized image metadata should be rejected")
	}
	if _, err := validateFeedbackAttachmentMetadata("file", "application/x-msdownload", 512); err == nil {
		t.Fatal("unsupported file MIME type should be rejected")
	}
}

func TestFeedbackAttachmentPrefixDoesNotExposeCustomUserID(t *testing.T) {
	prefix := feedbackAttachmentPrefix(7, "customer@example.com")
	if strings.Contains(prefix, "customer@example.com") {
		t.Fatalf("prefix exposes customer identifier: %q", prefix)
	}
	expectedHash := sha256.Sum256([]byte("customer@example.com"))
	if !strings.Contains(prefix, hex.EncodeToString(expectedHash[:])) {
		t.Fatalf("prefix does not include stable customer hash: %q", prefix)
	}
}

func TestFeedbackDeveloperAttachmentPrefixIsProjectAndMemberScoped(t *testing.T) {
	t.Setenv("OSS_ROOT_PATH", "workshop")
	prefix := feedbackDeveloperAttachmentPrefix(7, 42)
	if prefix != "workshop/feedbacks/v2/7/developers/42/" {
		t.Fatalf("developer prefix = %q", prefix)
	}
}

func TestTaskAttachmentReferenceRequiresRichAttachmentMarker(t *testing.T) {
	objectKey := "workshop/feedbacks/v2/7/customer/image.png"
	content := "来源反馈 #FB7 的附件：\n[image](" + objectKey + ")"
	if !taskAttachmentReferencesObjectKey(content, objectKey) {
		t.Fatal("rich image attachment should authorize its exact object key")
	}
	if taskAttachmentReferencesObjectKey(content, "workshop/feedbacks/v2/7/customer/other.png") {
		t.Fatal("unreferenced object key must not be authorized")
	}
}
