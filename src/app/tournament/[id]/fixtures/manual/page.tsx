'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import { useTournament, useTournamentRegistrations } from '@/lib/hooks/useTournament';
import { Button, Card, Input } from '@/components/ui';
import { ArrowLeft, Plus, Trash2, Shuffle, Eye, Save } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Pool {
  id: string;
  name: string;
  playerIds: string[];
  advanceCount: number;
}

interface Player {
  id: string;
  name: string;
  email: string;
  category?: string;
  rating?: string;
  gender?: string;
}

export default function ManualFixturesPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params?.id as string;
  const { user } = useUser();
  const { data: tournament } = useTournament(tournamentId);
  const { data: registrations } = useTournamentRegistrations(tournamentId);

  const [pools, setPools] = useState<Pool[]>([]);
  const [unassignedPlayers, setUnassignedPlayers] = useState<Player[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load players from registrations
  useEffect(() => {
    if (registrations) {
      const players: Player[] = registrations
        .filter((reg: any) => reg.status === 'confirmed')
        .map((reg: any) => ({
          id: reg.player?.id || reg.team?.id || reg.id,
          name: reg.player
            ? `${reg.player.first_name} ${reg.player.last_name}`
            : reg.team?.name || 'Unknown',
          email: reg.player?.email || reg.team?.player1?.email || '',
          category: reg.metadata?.category,
          rating: reg.metadata?.rating || reg.player?.player_rating,
          gender: reg.metadata?.gender || reg.player?.gender,
        }));
      
      setAllPlayers(players);
      setUnassignedPlayers(players);
    }
  }, [registrations]);

  const handleAddPool = () => {
    const poolLetter = String.fromCharCode(65 + pools.length); // A, B, C, etc.
    const newPool: Pool = {
      id: `pool-${Date.now()}`,
      name: `Pool ${poolLetter}`,
      playerIds: [],
      advanceCount: 2,
    };
    setPools([...pools, newPool]);
  };

  const handleRemovePool = (poolId: string) => {
    const pool = pools.find(p => p.id === poolId);
    if (!pool) return;

    // Return players to unassigned
    const playersToReturn = allPlayers.filter(p => pool.playerIds.includes(p.id));
    setUnassignedPlayers([...unassignedPlayers, ...playersToReturn]);
    
    setPools(pools.filter(p => p.id !== poolId));
    toast.success('Pool removed');
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activePlayerId = active.id as string;
    const overContainerId = over.id as string;

    // Check if dropping into a pool
    const targetPool = pools.find(p => p.id === overContainerId);
    
    if (targetPool) {
      // Remove from unassigned or other pool
      setUnassignedPlayers(unassignedPlayers.filter(p => p.id !== activePlayerId));
      setPools(pools.map(pool => {
        if (pool.id === targetPool.id) {
          if (!pool.playerIds.includes(activePlayerId)) {
            return { ...pool, playerIds: [...pool.playerIds, activePlayerId] };
          }
        } else {
          // Remove from other pools
          return { ...pool, playerIds: pool.playerIds.filter(id => id !== activePlayerId) };
        }
        return pool;
      }));
    } else if (overContainerId === 'unassigned') {
      // Dropping back to unassigned
      const player = allPlayers.find(p => p.id === activePlayerId);
      if (player && !unassignedPlayers.find(p => p.id === activePlayerId)) {
        setUnassignedPlayers([...unassignedPlayers, player]);
      }
      setPools(pools.map(pool => ({
        ...pool,
        playerIds: pool.playerIds.filter(id => id !== activePlayerId),
      })));
    }
  };

  const handleRemoveFromPool = (poolId: string, playerId: string) => {
    const player = allPlayers.find(p => p.id === playerId);
    if (player) {
      setUnassignedPlayers([...unassignedPlayers, player]);
    }
    setPools(pools.map(pool => 
      pool.id === poolId
        ? { ...pool, playerIds: pool.playerIds.filter(id => id !== playerId) }
        : pool
    ));
  };

  const handleAutoDistribute = () => {
    if (pools.length === 0) {
      toast.error('Create at least one pool first');
      return;
    }

    if (unassignedPlayers.length === 0) {
      toast.error('No unassigned players to distribute');
      return;
    }

    // Calculate base players per pool and remainder
    const playersPerPool = Math.floor(unassignedPlayers.length / pools.length);
    const remainder = unassignedPlayers.length % pools.length;

    // Distribute players
    const updatedPools = pools.map((pool, poolIndex) => {
      // Base allocation
      let allocation = playersPerPool;
      
      // Add one extra player to first N pools (where N = remainder)
      if (poolIndex < remainder) {
        allocation += 1;
      }

      // Get players for this pool
      const startIndex = poolIndex * playersPerPool + Math.min(poolIndex, remainder);
      const playerIdsForPool = unassignedPlayers
        .slice(startIndex, startIndex + allocation)
        .map(p => p.id);

      return {
        ...pool,
        playerIds: [...pool.playerIds, ...playerIdsForPool],
      };
    });

    setPools(updatedPools);
    setUnassignedPlayers([]);
    
    toast.success(`Distributed ${unassignedPlayers.length} players across ${pools.length} pools`);
  };

  const handleSavePools = async () => {
    // Validation
    const hasInvalidPools = pools.some(pool => pool.playerIds.length < 2);
    if (hasInvalidPools) {
      toast.error('Each pool must have at least 2 players');
      return;
    }

    setSaving(true);
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error('Please sign in again');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/tournaments/${tournamentId}/pools/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ pools }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to save pools: ${data.error}`);
        setSaving(false);
        return;
      }

      toast.success('Pools saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save pools');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateFixtures = async () => {
    const hasInvalidPools = pools.some(pool => pool.playerIds.length < 2);
    if (hasInvalidPools) {
      toast.error('Each pool must have at least 2 players before generating fixtures');
      return;
    }

    if (!confirm('Generate fixtures from these pools? This will create all pool matches and knockout rounds.')) {
      return;
    }

    setSaving(true);
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error('Please sign in again');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/tournaments/${tournamentId}/pools/generate-fixtures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ pools }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to generate fixtures: ${data.error}`);
        setSaving(false);
        return;
      }

      toast.success('Fixtures generated successfully!');
      router.push(`/tournament/${tournamentId}`);
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Failed to generate fixtures');
    } finally {
      setSaving(false);
    }
  };

  const isOrganizer = user?.id === tournament?.organizer_id;

  if (!isOrganizer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-12 text-center">
          <h1 className="mb-2 text-2xl font-bold">Access Denied</h1>
          <p className="mb-6 text-gray-600">Only tournament organizers can create fixtures</p>
          <Link href={`/tournament/${tournamentId}`}>
            <Button variant="primary">Back to Tournament</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/tournament/${tournamentId}`}>
                <Button variant="ghost" leftIcon={<ArrowLeft className="h-5 w-5" />}>
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manual Fixture Editor</h1>
                {tournament && <p className="mt-1 text-gray-600 dark:text-gray-400">{tournament.title}</p>}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                leftIcon={<Save className="h-5 w-5" />}
                onClick={handleSavePools}
                disabled={saving || pools.length === 0}
              >
                Save Pools
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateFixtures}
                disabled={saving || pools.length === 0}
              >
                Save & Generate Fixtures
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* Left Sidebar - Unassigned Players */}
            <div className="space-y-4">
              <Card padding="md">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Unassigned Players ({unassignedPlayers.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={handleAddPool}
                  >
                    Add Pool
                  </Button>
                </div>

                <DroppableArea id="unassigned" className="min-h-[200px]">
                  <div className="space-y-2">
                    {unassignedPlayers.map((player) => (
                      <DraggablePlayer key={player.id} player={player} />
                    ))}
                    {unassignedPlayers.length === 0 && (
                      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        All players assigned to pools
                      </p>
                    )}
                  </div>
                </DroppableArea>
              </Card>

              {/* Pool Controls */}
              <Card padding="md">
                <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">Pool Controls</h4>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Shuffle className="h-4 w-4" />}
                    onClick={handleAutoDistribute}
                    disabled={unassignedPlayers.length === 0 || pools.length === 0}
                    className="w-full"
                  >
                    Auto-Distribute Players
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4 text-red-600" />}
                    onClick={() => {
                      if (confirm('Reset all pools? This will unassign all players.')) {
                        setUnassignedPlayers(allPlayers);
                        setPools([]);
                        toast.success('Pools reset');
                      }
                    }}
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    Reset All Pools
                  </Button>
                </div>
              </Card>
            </div>

            {/* Main Area - Pools */}
            <div>
              {pools.length === 0 ? (
                <Card padding="lg" className="text-center">
                  <div className="py-12">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Pools Created</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Click "Add Pool" to create your first pool and start organizing players
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {pools.map((pool) => (
                    <PoolCard
                      key={pool.id}
                      pool={pool}
                      players={allPlayers.filter(p => pool.playerIds.includes(p.id))}
                      onRemovePlayer={(playerId) => handleRemoveFromPool(pool.id, playerId)}
                      onRemovePool={() => handleRemovePool(pool.id)}
                      onUpdateAdvanceCount={(count) => {
                        setPools(pools.map(p =>
                          p.id === pool.id ? { ...p, advanceCount: count } : p
                        ));
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          <div className="rounded-lg bg-primary-100 p-3 shadow-lg dark:bg-primary-800">
            <p className="font-medium text-primary-900 dark:text-primary-100">
              {allPlayers.find(p => p.id === activeId)?.name || 'Player'}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Draggable Player Component
function DraggablePlayer({ player }: { player: Player }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <p className="font-medium text-gray-900 dark:text-white">{player.name}</p>
      {player.rating && (
        <p className="text-xs text-gray-600 dark:text-gray-400">Rating: {player.rating}</p>
      )}
    </div>
  );
}

// Droppable Area Component
function DroppableArea({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
}

// Pool Card Component
function PoolCard({
  pool,
  players,
  onRemovePlayer,
  onRemovePool,
  onUpdateAdvanceCount,
}: {
  pool: Pool;
  players: Player[];
  onRemovePlayer: (playerId: string) => void;
  onRemovePool: () => void;
  onUpdateAdvanceCount: (count: number) => void;
}) {
  return (
    <Card padding="md">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{pool.name}</h3>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={onRemovePool}
        >
          Remove
        </Button>
      </div>

      <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        {players.length} player{players.length !== 1 ? 's' : ''}
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
          Advance to Knockout
        </label>
        <input
          type="number"
          min={1}
          max={Math.max(1, players.length - 1)}
          value={pool.advanceCount}
          onChange={(e) => onUpdateAdvanceCount(parseInt(e.target.value) || 1)}
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <DroppableArea id={pool.id} className="min-h-[200px] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800/50">
        <SortableContext items={pool.playerIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{player.name}</p>
                  {player.rating && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">{player.rating}</p>
                  )}
                </div>
                <button
                  onClick={() => onRemovePlayer(player.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {players.length === 0 && (
              <p className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                Drag players here
              </p>
            )}
          </div>
        </SortableContext>
      </DroppableArea>
    </Card>
  );
}

