package models

import (
	"testing"
)

func TestHasCapability(t *testing.T) {
	cases := []struct {
		name           string
		role           string
		capabilities   []string
		checkCap       string
		wantHasCap     bool
	}{
		{
			name:         "owner has triage capability by default",
			role:         ProjectRoleOwner,
			capabilities: []string{},
			checkCap:     CapabilityTriage,
			wantHasCap:   true,
		},
		{
			name:         "admin has triage capability by default",
			role:         ProjectRoleAdmin,
			capabilities: []string{},
			checkCap:     CapabilityTriage,
			wantHasCap:   true,
		},
		{
			name:         "member does not have triage capability by default",
			role:         ProjectRoleMember,
			capabilities: []string{},
			checkCap:     CapabilityTriage,
			wantHasCap:   false,
		},
		{
			name:         "member with explicit triage capability",
			role:         ProjectRoleMember,
			capabilities: []string{CapabilityTriage},
			checkCap:     CapabilityTriage,
			wantHasCap:   true,
		},
		{
			name:         "owner with explicit manage_code_repos capability",
			role:         ProjectRoleOwner,
			capabilities: []string{CapabilityManageCodeRepos},
			checkCap:     CapabilityManageCodeRepos,
			wantHasCap:   true,
		},
		{
			name:         "admin without manage_code_repos capability",
			role:         ProjectRoleAdmin,
			capabilities: []string{},
			checkCap:     CapabilityManageCodeRepos,
			wantHasCap:   false,
		},
		{
			name:         "member with multiple capabilities",
			role:         ProjectRoleMember,
			capabilities: []string{CapabilityTriage, CapabilityManageCodeRepos, CapabilityManageKnowledge},
			checkCap:     CapabilityManageKnowledge,
			wantHasCap:   true,
		},
		{
			name:         "member checking non-existent capability",
			role:         ProjectRoleMember,
			capabilities: []string{CapabilityTriage},
			checkCap:     CapabilityManageOpenHands,
			wantHasCap:   false,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			member := &ProjectMember{
				Role:         tc.role,
				Capabilities: tc.capabilities,
			}

			if got := member.HasCapability(tc.checkCap); got != tc.wantHasCap {
				t.Errorf("HasCapability(%q) = %v, want %v", tc.checkCap, got, tc.wantHasCap)
			}
		})
	}
}

func TestDefaultCapabilitiesForRole(t *testing.T) {
	cases := []struct {
		name     string
		role     string
		wantCaps []string
	}{
		{
			name:     "owner gets triage capability",
			role:     ProjectRoleOwner,
			wantCaps: []string{CapabilityTriage},
		},
		{
			name:     "admin gets triage capability",
			role:     ProjectRoleAdmin,
			wantCaps: []string{CapabilityTriage},
		},
		{
			name:     "member gets no capabilities",
			role:     ProjectRoleMember,
			wantCaps: []string{},
		},
		{
			name:     "unknown role gets no capabilities",
			role:     "unknown",
			wantCaps: []string{},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := DefaultCapabilitiesForRole(tc.role)
			if len(got) != len(tc.wantCaps) {
				t.Errorf("DefaultCapabilitiesForRole(%q) = %v, want %v", tc.role, got, tc.wantCaps)
				return
			}
			for i, cap := range got {
				if cap != tc.wantCaps[i] {
					t.Errorf("DefaultCapabilitiesForRole(%q)[%d] = %q, want %q", tc.role, i, cap, tc.wantCaps[i])
				}
			}
		})
	}
}

func TestCapabilityConstants(t *testing.T) {
	expectedCaps := []string{
		CapabilityTriage,
		CapabilityManageCodeRepos,
		CapabilityManageKnowledge,
		CapabilityManageOpenHands,
	}

	seen := make(map[string]bool)
	for _, cap := range expectedCaps {
		if cap == "" {
			t.Error("capability constant is empty")
		}
		if seen[cap] {
			t.Errorf("duplicate capability constant: %q", cap)
		}
		seen[cap] = true
	}
}
