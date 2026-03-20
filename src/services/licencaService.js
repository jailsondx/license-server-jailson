
//Prefixo de licensas
const prefixLicenseKey = "HIPDV-";
/**
 * Ativa licença
 */
export async function ativarLicenca(prisma, licenseKey, machine_id) {

  const chave_licenca = prefixLicenseKey + licenseKey;

  try {

    const licenca = await prisma.licenses.findUnique({
      where: {
        chave_licenca: chave_licenca
      }
    });

    // 🚫 Licença não encontrada
    if (!licenca) {
      console.log("Licença não encontrada ou inválida");
      return {
        success: false,
        code: 404,
        message: "Licença não encontrada ou inválida",
        data: null
      };
    }

    // 🚫 Licença inativa
    if (licenca.status !== "ativo") {
      console.log("Licença inativa ou bloqueada");
      return {
        success: false,
        code: 403,
        message: "Licença inativa ou bloqueada",
        data: null
      };
    }

    /**
     * Primeira ativação
     */
    if (!licenca.machine_id) {

      const updated = await prisma.licenses.update({
        where: { chave_licenca: chave_licenca },
        data: {
          machine_id,
          ativado_em: new Date()
        }
      });

      console.log("Licença ativada com sucesso");

      validarLicenca(prisma, licenseKey, machine_id);

      return {
        success: true,
        code: 200,
        message: "Licença ativada com sucesso",
        data: {
          chave_licenca: updated.licenseKey,
          machine_id: updated.machine_id,
          status: updated.status,
          ativado_em: updated.ativado_em
        }
      };
    }

    /**
     * Máquina diferente
     */
    if (licenca.machine_id !== machine_id) {
      console.log("Licença já está vinculada a outra máquina");
      return {
        success: false,
        code: 403,
        message: "Licença já está vinculada a outra máquina",
        data: null
      };
    }

    /**
     * Validação obrigatória do ativado_em
     */
    if (!licenca.ativado_em) {
      console.log("Licença sem data de ativação");
      return {
        success: false,
        code: 500,
        message: "Licença sem data de ativação",
        data: null
      };
    }

    console.log("Licença já ativa e válida");

    return {
      success: true,
      code: 200,
      message: "Licença já ativa",
      data: {
        chave_licenca: licenca.chave_licenca,
        machine_id: licenca.machine_id,
        status: licenca.status,
        ativado_em: licenca.ativado_em
      }
    };

  } catch (error) {

    console.error("Erro ao ativar licença:", error);

    return {
      success: false,
      code: 500,
      message: "Erro interno ao ativar licença",
      error: error.message
    };

  }

}

/**
 * Validação simples
 */
export async function validarLicenca(prisma, licenseKey, machine_id) {

  const chave_licenca = prefixLicenseKey + licenseKey;

  try {

    const licenca = await prisma.licenses.findUnique({
      where: {
        chave_licenca: chave_licenca,
        //machine_id: machine_id
      }
    });

    // 🚫 Licença não encontrada
    if (!licenca) {
      console.log("Licença não encontrada ou inválida");
      return {
        success: false,
        code: 404,
        message: "Licença não encontrada ou inválida",
        data: null
      };
    }

    // 🚫 Máquina diferente
    if (licenca.machine_id !== machine_id) {
      console.log("Licença não pertence a esta máquina");
      return {
        success: false,
        code: 403,
        message: "Licença não pertence a esta máquina",
        data: null
      };
    }

    // 🚫 Licença desativada
    if (licenca.status !== "ativo") {
      console.log("Licença inativa ou bloqueada");
      return {
        success: false,
        code: 403,
        message: "Licença inativa ou bloqueada",
        data: null
      };
    }

    console.log('Licença válida');
    // ✅ Licença válida

    //Atualizar a Ultima Checagem 
    await prisma.licenses.update({
      where: { chave_licenca },
      data: { ultima_check: new Date() }
    });

    return {
      success: true,
      code: 200,
      message: "Licença válida",
      data: {
        chave_licenca: licenca.chave_licenca,
        machine_id: licenca.machine_id,
        status: licenca.status
      }
    };

  } catch (error) {

    console.error("Erro ao validar licença:", error);

    return {
      success: false,
      code: 500,
      message: "Erro interno ao validar licença",
      error: error.message
    };

  }

}