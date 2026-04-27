import { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Grid,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import type { GoogleMapProps } from "@react-google-maps/api";

import { useNavigate, useParams } from "react-router-dom";
import { getParadaInfo } from "../services/api";
import { getLineaGobierno } from "../services/apiGobierno";
import { useLineasGobierno } from "../hooks/useLineasGobierno";
import type { Arribo, ParadaInfo } from "../types";

const GOOGLE_MAPS_API_KEY = "AIzaSyCP4Zo1sJq5nfWsnWNUa9j6aI5lSMWArBk";

const mapContainerStyle = {
  width: "100%",
  height: "350px",
};

export default function DetalleScreen() {
  const { id, interno } = useParams<{ id: string; interno: string }>();
  const navigate = useNavigate();
  const { buscarLineaId } = useLineasGobierno();
  
  const [arribo, setArribo] = useState<Arribo | null>(null);
  const [parada, setParada] = useState<ParadaInfo | null>(null);
  const [lineaDetalle, setLineaDetalle] = useState<any>(null);
  const [loadingRecorrido, setLoadingRecorrido] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const initialLoadDone = useRef(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-maps-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    setArribo(null);
    setParada(null);
    setLineaDetalle(null);
    setLoading(true);
    initialLoadDone.current = false;
    setRefreshing(false);

    const fetchData = async () => {
      if (!id) return;
      
      if (initialLoadDone.current) {
        setRefreshing(true);
      }
      
      try {
        const result = await getParadaInfo(id);
        console.log('API response:', result);
        const found = result.arribos?.find(
          (a: Arribo) => a.identificadorCoche === interno,
        );
        console.log('Found arrival:', found);
        console.log('distanciaKm:', found?.distanciaKm);
        console.log('tiempoArriboMinutos:', found?.tiempoArriboMinutos);
        console.log('minutosDesdeUltimaGPS:', found?.minutosDesdeUltimaGPS);
        setArribo(found || null);
        setParada(result.parada?.[0] || null);

        if (found) {
          setLoadingRecorrido(true);
          try {
            const lineaId = buscarLineaId(found.descripcionLinea);
            console.log(
              "Buscando lineaId:",
              found.descripcionLinea,
              "->",
              lineaId,
            );

            if (lineaId) {
              const rec = await getLineaGobierno("1", lineaId);
              console.log("Recorrido cargado:", rec);
              setLineaDetalle(rec);
            }
          } catch (e: any) {
            console.log("No se pudo cargar recorrido:", e?.message || e);
          } finally {
            setLoadingRecorrido(false);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
        }
        setLoading(false);
        setRefreshing(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [id, interno, buscarLineaId]);

  const handleShare = async () => {
    if (!arribo || !parada) return;
    const text = `${arribo.descripcionLinea} ${arribo.descripcionCortaBandera} (Int. ${arribo.identificadorCoche}) llega en ${arribo.tiempoArriboMinutos} min. a la parada ${parada.cod_sms} (${parada.calle1Nombre} y ${parada.calle2Nombre})`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Magic Bus", text });
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

const formatDistancia = (km: number) => {
    if (km < 1) return `${(km * 1000).toFixed(0)} mts.`;
    return `${km.toFixed(2)} km.`;
  };

  const center = useMemo(() => {
    if (parada) {
      return { lat: parada.punto_x, lng: parada.punto_y };
    }
    return { lat: -32.9441, lng: -60.6346 };
  }, [parada]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !arribo || !parada) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(center);
    bounds.extend({ lat: arribo.latitud, lng: arribo.longitud });
    mapRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
  }, [arribo, mapReady, center]);

  const getHoraArribo = () => {
    const mins = arribo?.tiempoArriboMinutos ?? null;
    if (!arribo || mins === null || mins <= 0) {
      return "Llegando";
    }
    const hora = new Date(Date.now() + mins * 60000);
    return hora.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const colorLinea = lineaDetalle?.color || "#1976d2";

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar position="static" elevation={0} sx={{ bgcolor: "primary.main" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, color: "white" }}>
            Detalle
          </Typography>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="sm"
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column", py: 2 }}
      >
        {loading ? (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="40%" />
            <List dense>
              {[1, 2, 3, 4, 5].map((i) => (
                <ListItem key={i}>
                  <ListItemText
                    primary={<Skeleton variant="text" width="40%" />}
                    secondary={<Skeleton variant="text" width="70%" />}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          <>
{arribo && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ color: colorLinea }}
                >
                  {arribo.descripcionLinea} {arribo.descripcionCortaBandera}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  (Int. {arribo.identificadorCoche})
                </Typography>

                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Hora de arribo"
                      secondary={refreshing ? <Skeleton variant="text" width={60} /> : getHoraArribo()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Bandera / recorrido"
                      secondary={refreshing ? <Skeleton variant="text" width={100} /> : arribo.descripcionBandera}
                    />
                  </ListItem>
                  {parada && (
                    <ListItem>
                      <ListItemText
                        primary="Parada"
                        secondary={refreshing ? <Skeleton variant="text" width={150} /> : `${parada.cod_sms} - ${parada.calle1Nombre} Y ${parada.calle2Nombre}`}
                      />
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemText
                      primary="Última actualización GPS"
                      secondary={refreshing ? <Skeleton variant="text" width={50} /> : `hace ${arribo.minutosDesdeUltimaGPS} min`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Distancia"
                      secondary={refreshing ? <Skeleton variant="text" width={80} /> : `El coche se encuentra a ${formatDistancia(arribo.distanciaKm)}`}
                    />
                  </ListItem>
                </List>
              </Paper>
            )}
          </>
        )}

        <Box sx={{ height: 350, mb: 2, borderRadius: 2, overflow: "hidden" }}>
          {!isLoaded || loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                bgcolor: "#f0f0f0",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
<GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={14}
              onLoad={(map) => {
                mapRef.current = map;
                setMapReady(true);
              }}
              options={{
                disableDefaultUI: true,
                zoomControl: false,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                keyboardShortcuts: false,
              }}
            >
              <Marker
                position={center}
                label="📍"
                title={parada ? `Parada ${parada.cod_sms}` : "Parada"}
              />
              {arribo && (
                <Marker
                  position={{ lat: arribo.latitud, lng: arribo.longitud }}
                  label="🚌"
                  title={`Coche ${arribo.identificadorCoche}`}
                />
              )}
            </GoogleMap>
          )}
        </Box>

        {loadingRecorrido && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={handleShare}
            >
              Compartir
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button fullWidth variant="contained" onClick={() => navigate("/")}>
              Volver
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
