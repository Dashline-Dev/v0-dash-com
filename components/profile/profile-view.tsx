"use client"

import { useState } from "react"
import { User, MapPin, Link as LinkIcon, Users, CalendarDays, Settings, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { upsertUserProfile } from "@/lib/actions/user-actions"
import type { MockUser } from "@/lib/mock-user"
import type { UserProfile, CommunityMembership } from "@/types/user"

interface ProfileViewProps {
  user: MockUser
  profile: UserProfile | null
  communities: unknown[]
  stats: { communityCount: number; eventCount: number }
}

export function ProfileView({ user, profile, communities, stats }: ProfileViewProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? user.name)
  const [bio, setBio] = useState(profile?.bio ?? "")
  const [locationName, setLocationName] = useState(profile?.location_name ?? "")
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url ?? "")

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertUserProfile(user.id, {
        display_name: displayName,
        bio,
        location_name: locationName,
        website_url: websiteUrl,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const typedCommunities = communities as CommunityMembership[]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar className="w-16 h-16 md:w-20 md:h-20">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg">
            {(displayName ?? "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground text-balance">
            {displayName ?? "Anonymous"}
          </h1>
          {locationName && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{locationName}</span>
            </div>
          )}
          {websiteUrl && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <LinkIcon className="w-3.5 h-3.5" />
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {websiteUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {bio && <p className="text-sm text-muted-foreground mt-2">{bio}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Cancel" : "Edit Profile"}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings">
              <Settings className="w-4 h-4" />
              <span className="sr-only">Account Settings</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Portland, OR"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.communityCount}</p>
              <p className="text-xs text-muted-foreground">Communities</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.eventCount}</p>
              <p className="text-xs text-muted-foreground">Events Attended</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Communities */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">My Communities</h2>
        {typedCommunities.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                {"You haven't joined any communities yet."}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/communities">Browse Communities</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {typedCommunities.map((cm) => (
              <Link key={cm.id} href={`/communities/${cm.community_slug}`}>
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {cm.community_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {cm.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Joined {new Date(cm.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
